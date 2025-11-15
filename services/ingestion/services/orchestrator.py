"""
Orchestration service to coordinate ingestion workflows.
Combines RTSP capture, upload handling, storage, and database operations.
"""
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Optional, BinaryIO
from uuid import UUID
import cv2
import numpy as np

from config import get_settings
from models.schemas import (
    SourceType, CaptureMode, IngestionStatus,
    RTSPIngestionRequest, UploadIngestionRequest,
    IngestionResponse, FrameInfo
)
from services.rtsp_capture import RTSPCaptureManager, RTSPStreamCapture
from services.upload_handler import FileUploadHandler, BatchUploadHandler
from services.storage_service import StorageService
from .segmentation import (
    SegmentationArtifacts,
    SegmentationJobSpec,
    SegmentationPipeline,
)
from repositories.database import (
    DatabaseManager, IngestionRequestRepository,
    FrameRepository, CameraConfigRepository
)
from utils.logger import get_logger
from utils.exceptions import IngestionException

logger = get_logger(__name__)


class IngestionOrchestrator:
    """
    Orchestrates the complete ingestion workflow.
    Coordinates between capture, storage, and database operations.
    """
    
    def __init__(self):
        """Initialize orchestrator with required services."""
        self.settings = get_settings()
        self.rtsp_manager = RTSPCaptureManager()
        self.upload_handler = FileUploadHandler()
        self.batch_handler = BatchUploadHandler()
        self.storage_service = StorageService()
        self.segmentation_pipeline = SegmentationPipeline()
        self.db_manager = DatabaseManager()
        
        logger.info("ingestion_orchestrator_initialized")
    
    async def process_rtsp_request(
        self,
        request: RTSPIngestionRequest
    ) -> IngestionResponse:
        """
        Process RTSP stream ingestion request.
        
        Args:
            request: RTSP ingestion request
            
        Returns:
            Ingestion response with captured frames
        """
        async with self.db_manager.get_session() as session:
            request_repo = IngestionRequestRepository(session)
            frame_repo = FrameRepository(session)
            
            # Create ingestion request record
            db_request = await request_repo.create(
                camera_id=request.camera_id,
                source_type=SourceType.RTSP,
                rtsp_url=request.rtsp_url,
                capture_mode=request.capture_mode.value,
                capture_duration=request.capture_duration,
                fps=request.fps,
                metadata=request.meta.model_dump() if request.meta else None
            )
            
            request_id = db_request.id
            
            try:
                # Update status to in-progress
                await request_repo.update_status(
                    request_id,
                    IngestionStatus.IN_PROGRESS,
                    message="Starting RTSP capture"
                )
                
                # Create RTSP capture
                capture = self.rtsp_manager.create_capture(
                    rtsp_url=request.rtsp_url,
                    camera_id=request.camera_id,
                    capture_mode=request.capture_mode,
                    fps=request.fps,
                    duration=request.capture_duration
                )
                
                # Start capture
                capture.start()
                
                # Wait for capture to complete or timeout
                timeout = request.capture_duration or self.settings.rtsp.capture_timeout
                await asyncio.sleep(min(timeout, 5))  # Wait for frames
                
                # Get captured frames
                frames = capture.get_all_frames()
                
                if not frames:
                    # Try to get at least one frame for single_frame mode
                    if request.capture_mode == CaptureMode.SINGLE_FRAME:
                        frame_data = capture.get_frame(timeout=5.0)
                        if frame_data:
                            frames = [frame_data]
                
                # Stop capture
                capture.stop()
                self.rtsp_manager.remove_capture(request.camera_id)
                
                if not frames:
                    raise IngestionException(
                        "No frames captured from RTSP stream",
                        details={"camera_id": request.camera_id, "rtsp_url": request.rtsp_url}
                    )
                
                # Process and store frames
                frame_infos = []
                for frame_data, timestamp in frames:
                    frame_info = await self._store_frame(
                        frame_data=frame_data,
                        camera_id=request.camera_id,
                        request_id=request_id,
                        source_type=SourceType.RTSP,
                        capture_timestamp=timestamp,
                        frame_repo=frame_repo
                    )
                    frame_infos.append(frame_info)
                
                # Update status to completed
                await request_repo.update_status(
                    request_id,
                    IngestionStatus.COMPLETED,
                    message=f"Successfully captured {len(frame_infos)} frame(s)"
                )
                
                logger.info(
                    "rtsp_ingestion_completed",
                    request_id=str(request_id),
                    camera_id=request.camera_id,
                    frames_captured=len(frame_infos)
                )
                
                return IngestionResponse(
                    request_id=request_id,
                    status=IngestionStatus.COMPLETED,
                    camera_id=request.camera_id,
                    source_type=SourceType.RTSP,
                    frames=frame_infos,
                    message=f"Successfully captured {len(frame_infos)} frame(s)",
                    completed_at=datetime.utcnow()
                )
                
            except Exception as e:
                logger.error(
                    "rtsp_ingestion_failed",
                    request_id=str(request_id),
                    camera_id=request.camera_id,
                    error=str(e)
                )
                
                # Update status to failed
                await request_repo.update_status(
                    request_id,
                    IngestionStatus.FAILED,
                    message=str(e),
                    error_details={"error": str(e), "error_type": type(e).__name__}
                )
                
                # Cleanup
                self.rtsp_manager.remove_capture(request.camera_id)
                
                raise
    
    async def process_upload_request(
        self,
        request: UploadIngestionRequest,
        files: List[tuple[BinaryIO, str]]
    ) -> IngestionResponse:
        """
        Process manual upload ingestion request.
        
        Args:
            request: Upload ingestion request
            files: List of (file, filename) tuples
            
        Returns:
            Ingestion response with uploaded frames
        """
        async with self.db_manager.get_session() as session:
            request_repo = IngestionRequestRepository(session)
            frame_repo = FrameRepository(session)
            
            # Create ingestion request record
            db_request = await request_repo.create(
                camera_id=request.camera_id,
                source_type=SourceType.UPLOAD,
                metadata=request.meta.model_dump() if request.meta else None
            )
            
            request_id = db_request.id
            
            try:
                # Update status to in-progress
                await request_repo.update_status(
                    request_id,
                    IngestionStatus.IN_PROGRESS,
                    message="Processing uploaded files"
                )
                
                # Process batch upload
                processed_files = await self.batch_handler.process_batch(
                    files=files,
                    camera_id=request.camera_id
                )
                
                if not processed_files:
                    raise IngestionException(
                        "No files were successfully processed",
                        details={"camera_id": request.camera_id}
                    )
                
                # Store frames
                frame_infos = []
                for file_path, metadata in processed_files:
                    try:
                        frame_info = await self._store_uploaded_frame(
                            file_path=file_path,
                            camera_id=request.camera_id,
                            request_id=request_id,
                            metadata=metadata,
                            frame_repo=frame_repo
                        )
                        frame_infos.append(frame_info)
                        
                    except Exception as e:
                        logger.error(
                            "frame_processing_failed",
                            file_path=str(file_path),
                            error=str(e)
                        )
                        continue
                
                if not frame_infos:
                    raise IngestionException(
                        "No frames were successfully stored",
                        details={"camera_id": request.camera_id}
                    )

                segmentation_result = None
                try:
                    segmentation_result = await self._maybe_run_segmentation(
                        request_id=request_id,
                        camera_id=request.camera_id,
                        processed_files=processed_files
                    )
                finally:
                    for file_path, _ in processed_files:
                        self.upload_handler.cleanup_temp_file(file_path)

                success_message = f"Successfully uploaded {len(frame_infos)} frame(s)"
                if segmentation_result:
                    success_message += " | Segmentation artifacts generated (Steps 1-4)"
                
                # Update status to completed
                await request_repo.update_status(
                    request_id,
                    IngestionStatus.COMPLETED,
                    message=success_message
                )
                
                logger.info(
                    "upload_ingestion_completed",
                    request_id=str(request_id),
                    camera_id=request.camera_id,
                    frames_uploaded=len(frame_infos),
                    segmentation_enabled=bool(segmentation_result)
                )
                
                return IngestionResponse(
                    request_id=request_id,
                    status=IngestionStatus.COMPLETED,
                    camera_id=request.camera_id,
                    source_type=SourceType.UPLOAD,
                    frames=frame_infos,
                    message=success_message,
                    completed_at=datetime.utcnow()
                )
                
            except Exception as e:
                logger.error(
                    "upload_ingestion_failed",
                    request_id=str(request_id),
                    camera_id=request.camera_id,
                    error=str(e)
                )
                
                # Update status to failed
                await request_repo.update_status(
                    request_id,
                    IngestionStatus.FAILED,
                    message=str(e),
                    error_details={"error": str(e), "error_type": type(e).__name__}
                )
                
                raise
    
    async def _store_frame(
        self,
        frame_data: np.ndarray,
        camera_id: str,
        request_id: UUID,
        source_type: SourceType,
        capture_timestamp: datetime,
        frame_repo: FrameRepository
    ) -> FrameInfo:
        """Store frame data to storage and database."""
        # Generate unique frame ID
        from uuid import uuid4
        frame_id = uuid4()
        
        # Encode frame to JPEG
        success, buffer = cv2.imencode('.jpg', frame_data)
        if not success:
            raise IngestionException("Failed to encode frame to JPEG")
        
        frame_bytes = buffer.tobytes()
        
        # Generate storage path
        storage_path = self.storage_service.generate_storage_path(
            camera_id=camera_id,
            frame_id=frame_id,
            timestamp=capture_timestamp,
            extension="jpg"
        )
        
        # Upload to storage
        await asyncio.to_thread(
            self.storage_service.upload_frame_from_bytes,
            data=frame_bytes,
            storage_path=storage_path,
            content_type="image/jpeg",
            metadata={
                "camera_id": camera_id,
                "request_id": str(request_id),
                "capture_timestamp": capture_timestamp.isoformat()
            }
        )
        
        # Generate presigned URL
        storage_url = await asyncio.to_thread(
            self.storage_service.generate_presigned_url,
            storage_path=storage_path
        )
        
        # Create database record
        db_frame = await frame_repo.create(
            request_id=request_id,
            camera_id=camera_id,
            source_type=source_type,
            storage_path=storage_path,
            storage_bucket=self.settings.storage.bucket_name,
            storage_url=storage_url,
            width=frame_data.shape[1],
            height=frame_data.shape[0],
            size_bytes=len(frame_bytes),
            format="jpg",
            capture_timestamp=capture_timestamp
        )
        
        return FrameInfo(
            frame_id=db_frame.id,
            storage_path=storage_path,
            storage_url=storage_url,
            timestamp=capture_timestamp,
            width=frame_data.shape[1],
            height=frame_data.shape[0],
            size_bytes=len(frame_bytes),
            format="jpg"
        )
    
    async def _store_uploaded_frame(
        self,
        file_path: Path,
        camera_id: str,
        request_id: UUID,
        metadata: dict,
        frame_repo: FrameRepository
    ) -> FrameInfo:
        """Store uploaded frame to storage and database."""
        from uuid import uuid4
        frame_id = uuid4()
        
        # Extract file extension
        extension = file_path.suffix.lstrip('.')
        
        # Generate storage path
        storage_path = self.storage_service.generate_storage_path(
            camera_id=camera_id,
            frame_id=frame_id,
            timestamp=datetime.utcnow(),
            extension=extension
        )
        
        # Upload to storage
        await asyncio.to_thread(
            self.storage_service.upload_frame,
            file_path=file_path,
            storage_path=storage_path,
            metadata={
                "camera_id": camera_id,
                "request_id": str(request_id),
                "original_filename": metadata.get('original_filename')
            }
        )
        
        # Generate presigned URL
        storage_url = await asyncio.to_thread(
            self.storage_service.generate_presigned_url,
            storage_path=storage_path
        )
        
        # Create database record
        db_frame = await frame_repo.create(
            request_id=request_id,
            camera_id=camera_id,
            source_type=SourceType.UPLOAD,
            storage_path=storage_path,
            storage_bucket=self.settings.storage.bucket_name,
            storage_url=storage_url,
            width=metadata.get('width'),
            height=metadata.get('height'),
            size_bytes=metadata.get('size_bytes'),
            format=metadata.get('format'),
            capture_timestamp=datetime.fromisoformat(metadata.get('upload_timestamp')),
            meta_info=metadata
        )
        
        return FrameInfo(
            frame_id=db_frame.id,
            storage_path=storage_path,
            storage_url=storage_url,
            timestamp=db_frame.capture_timestamp,
            width=metadata.get('width'),
            height=metadata.get('height'),
            size_bytes=metadata.get('size_bytes'),
            format=metadata.get('format')
        )

    async def _maybe_run_segmentation(
        self,
        request_id: UUID,
        camera_id: str,
        processed_files: list[tuple[Path, dict]],
    ) -> Optional[SegmentationArtifacts]:
        """Run SAM segmentation when we have at least a baseline/current pair."""
        if len(processed_files) < 2:
            logger.debug(
                "segmentation_skipped_insufficient_files",
                request_id=str(request_id),
                available=len(processed_files)
            )
            return None

        baseline_path, baseline_meta = processed_files[0]
        current_path, current_meta = processed_files[1]

        job = SegmentationJobSpec(
            baseline_path=baseline_path,
            current_path=current_path,
            camera_id=camera_id,
            request_id=request_id,
            metadata={
                "baseline": baseline_meta,
                "current": current_meta,
            }
        )

        try:
            result = await asyncio.to_thread(self.segmentation_pipeline.run, job)
            logger.info(
                "segmentation_artifacts_generated",
                request_id=str(request_id),
                camera_id=camera_id,
                artifacts={k: str(v) for k, v in result.artifact_paths.items()}
            )
            return result
        except FileNotFoundError as missing_checkpoint:
            logger.warning(
                "segmentation_checkpoint_missing",
                request_id=str(request_id),
                error=str(missing_checkpoint)
            )
        except Exception as exc:
            logger.error(
                "segmentation_pipeline_error",
                request_id=str(request_id),
                error=str(exc)
            )
        return None
    
    async def get_request_status(self, request_id: UUID) -> Optional[IngestionResponse]:
        """Get the status of an ingestion request."""
        async with self.db_manager.get_session() as session:
            request_repo = IngestionRequestRepository(session)
            frame_repo = FrameRepository(session)
            
            db_request = await request_repo.get_by_id(request_id)
            if not db_request:
                return None
            
            # Get associated frames
            db_frames = await frame_repo.list_by_request(request_id)
            
            frame_infos = [
                FrameInfo(
                    frame_id=frame.id,
                    storage_path=frame.storage_path,
                    storage_url=frame.storage_url,
                    timestamp=frame.capture_timestamp,
                    width=frame.width,
                    height=frame.height,
                    size_bytes=frame.size_bytes,
                    format=frame.format
                )
                for frame in db_frames
            ]
            
            return IngestionResponse(
                request_id=db_request.id,
                status=db_request.status,
                camera_id=db_request.camera_id,
                source_type=db_request.source_type,
                frames=frame_infos,
                message=db_request.message,
                created_at=db_request.created_at,
                completed_at=db_request.completed_at
            )
    
    async def cleanup(self):
        """Cleanup resources."""
        self.rtsp_manager.stop_all()
        await self.db_manager.close()
        logger.info("ingestion_orchestrator_cleanup_complete")
