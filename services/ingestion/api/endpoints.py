"""
FastAPI REST API endpoints for the ingestion service.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends, status
from fastapi.responses import JSONResponse

from models.schemas import (
    RTSPIngestionRequest, UploadIngestionRequest,
    IngestionResponse, ErrorResponse, FrameMetadata
)
from services.orchestrator import IngestionOrchestrator
from utils.logger import get_logger
from utils.exceptions import (
    IngestionException, ValidationError, RTSPConnectionError,
    StorageError, DatabaseError
)

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/ingest", tags=["ingestion"])

# Global orchestrator instance (will be initialized in main.py)
orchestrator: IngestionOrchestrator = None


def get_orchestrator() -> IngestionOrchestrator:
    """Dependency to get orchestrator instance."""
    if orchestrator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingestion service not initialized"
        )
    return orchestrator


@router.post(
    "/rtsp",
    response_model=IngestionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest from RTSP stream",
    description="Capture frames from an RTSP camera stream",
    responses={
        202: {"description": "Ingestion request accepted and processing"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "Service unavailable"},
    }
)
async def ingest_rtsp(
    request: RTSPIngestionRequest,
    orch: IngestionOrchestrator = Depends(get_orchestrator)
):
    """
    Ingest frames from RTSP stream.
    
    - **rtsp_url**: RTSP stream URL (e.g., rtsp://user:pass@camera:554/stream)
    - **camera_id**: Unique camera identifier
    - **capture_mode**: single_frame, continuous, or event_driven
    - **frame_timestamp**: Optional specific timestamp to capture (for single_frame)
    - **capture_duration**: Duration in seconds for continuous capture
    - **fps**: Frames per second to capture
    - **meta**: Additional metadata
    """
    try:
        logger.info(
            "rtsp_ingestion_request_received",
            camera_id=request.camera_id,
            capture_mode=request.capture_mode.value
        )
        
        response = await orch.process_rtsp_request(request)
        return response
        
    except ValidationError as e:
        logger.error("rtsp_validation_error", error=str(e), camera_id=request.camera_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="ValidationError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except RTSPConnectionError as e:
        logger.error("rtsp_connection_error", error=str(e), camera_id=request.camera_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ErrorResponse(
                error="RTSPConnectionError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except IngestionException as e:
        logger.error("rtsp_ingestion_error", error=str(e), camera_id=request.camera_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=e.error_code,
                message=e.message,
                details=e.details
            ).model_dump()
        )


@router.post(
    "/upload",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest uploaded images",
    description="Upload and ingest one or more images manually",
    responses={
        201: {"description": "Ingestion completed successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        413: {"model": ErrorResponse, "description": "File too large"},
    }
)
async def ingest_upload(
    camera_id: str = Form(..., description="Unique camera identifier"),
    files: List[UploadFile] = File(..., description="Image files to upload"),
    meta: str = Form(None, description="Additional metadata (JSON string)"),
    orch: IngestionOrchestrator = Depends(get_orchestrator)
):
    """
    Ingest manually uploaded images.
    
    - **camera_id**: Unique camera identifier
    - **files**: One or more image files (jpg, png, bmp, tiff)
    - **meta**: Optional metadata as JSON string
    """
    try:
        logger.info(
            "upload_ingestion_request_received",
            camera_id=camera_id,
            file_count=len(files)
        )
        
        # Parse metadata if provided
        frame_meta = None
        if meta:
            import json
            meta_dict = json.loads(meta)
            frame_meta = FrameMetadata(**meta_dict)
        
        # Create request object
        request = UploadIngestionRequest(
            camera_id=camera_id,
            meta=frame_meta
        )
        
        # Prepare files for processing
        file_list = []
        for upload_file in files:
            # Read file content
            content = await upload_file.read()
            # Create file-like object
            from io import BytesIO
            file_obj = BytesIO(content)
            file_list.append((file_obj, upload_file.filename))
        
        response = await orch.process_upload_request(request, file_list)
        return response
        
    except ValidationError as e:
        logger.error("upload_validation_error", error=str(e), camera_id=camera_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="ValidationError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except IngestionException as e:
        logger.error("upload_ingestion_error", error=str(e), camera_id=camera_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=e.error_code,
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="ValidationError",
                message="Invalid metadata JSON format",
                details={"field": "meta"}
            ).model_dump()
        )


@router.get(
    "/status/{request_id}",
    response_model=IngestionResponse,
    summary="Get ingestion request status",
    description="Retrieve the status and results of an ingestion request",
    responses={
        200: {"description": "Request status retrieved"},
        404: {"model": ErrorResponse, "description": "Request not found"},
    }
)
async def get_status(
    request_id: UUID,
    orch: IngestionOrchestrator = Depends(get_orchestrator)
):
    """
    Get the status of an ingestion request.
    
    - **request_id**: Unique request identifier (UUID)
    """
    try:
        logger.info("ingestion_status_request", request_id=str(request_id))
        
        response = await orch.get_request_status(request_id)
        
        if response is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorResponse(
                    error="NotFound",
                    message=f"Ingestion request {request_id} not found",
                    details={"request_id": str(request_id)}
                ).model_dump()
            )
        
        return response
        
    except DatabaseError as e:
        logger.error("status_retrieval_error", error=str(e), request_id=str(request_id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="DatabaseError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
