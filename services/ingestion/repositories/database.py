"""
Database repository layer for ingestion data persistence.
Provides abstraction over SQLAlchemy operations.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, update, delete, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from config import get_settings
from models.entities import Base, IngestionRequest, Frame, CameraConfiguration
from models.schemas import IngestionStatus, SourceType
from utils.logger import get_logger
from utils.exceptions import DatabaseError

logger = get_logger(__name__)


class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self):
        """Initialize database manager."""
        self.settings = get_settings().db
        self.engine = create_async_engine(
            self.settings.url,
            pool_size=self.settings.pool_size,
            max_overflow=self.settings.max_overflow,
            echo=False,
            future=True
        )
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        logger.info("database_manager_initialized", url=self._sanitize_url(self.settings.url))
    
    async def create_tables(self):
        """Create all database tables."""
        try:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("database_tables_created")
        except SQLAlchemyError as e:
            logger.error("database_tables_creation_failed", error=str(e))
            raise DatabaseError(f"Failed to create database tables: {str(e)}")
    
    async def drop_tables(self):
        """Drop all database tables."""
        try:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
            logger.info("database_tables_dropped")
        except SQLAlchemyError as e:
            logger.error("database_tables_drop_failed", error=str(e))
            raise DatabaseError(f"Failed to drop database tables: {str(e)}")
    
    async def close(self):
        """Close database connections."""
        await self.engine.dispose()
        logger.info("database_connections_closed")
    
    def get_session(self) -> AsyncSession:
        """Get a new database session."""
        return self.async_session()
    
    @staticmethod
    def _sanitize_url(url: str) -> str:
        """Sanitize database URL by removing password."""
        try:
            from sqlalchemy.engine.url import make_url
            parsed = make_url(url)
            if parsed.password:
                return str(parsed.set(password="***"))
            return url
        except Exception:
            return "***"


class IngestionRequestRepository:
    """Repository for ingestion request operations."""
    
    def __init__(self, session: AsyncSession):
        """
        Initialize repository with database session.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    async def create(
        self,
        camera_id: str,
        source_type: SourceType,
        rtsp_url: Optional[str] = None,
        capture_mode: Optional[str] = None,
        capture_duration: Optional[int] = None,
        fps: Optional[float] = None,
        metadata: Optional[dict] = None
    ) -> IngestionRequest:
        """
        Create new ingestion request.
        
        Args:
            camera_id: Camera identifier
            source_type: Source type (RTSP or upload)
            rtsp_url: RTSP URL (if applicable)
            capture_mode: Capture mode (if applicable)
            capture_duration: Capture duration (if applicable)
            fps: Frames per second (if applicable)
            metadata: Additional metadata
            
        Returns:
            Created IngestionRequest entity
            
        Raises:
            DatabaseError: If creation fails
        """
        try:
            request = IngestionRequest(
                camera_id=camera_id,
                source_type=source_type,
                rtsp_url=rtsp_url,
                capture_mode=capture_mode,
                capture_duration=capture_duration,
                fps=fps,
                metadata=metadata,
                status=IngestionStatus.PENDING
            )
            
            self.session.add(request)
            await self.session.commit()
            await self.session.refresh(request)
            
            logger.info("ingestion_request_created", request_id=str(request.id), camera_id=camera_id)
            
            return request
            
        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error("ingestion_request_creation_failed", camera_id=camera_id, error=str(e))
            raise DatabaseError(
                f"Failed to create ingestion request: {str(e)}",
                details={"camera_id": camera_id}
            )
    
    async def get_by_id(self, request_id: UUID) -> Optional[IngestionRequest]:
        """Get ingestion request by ID."""
        try:
            result = await self.session.execute(
                select(IngestionRequest).where(IngestionRequest.id == request_id)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("ingestion_request_retrieval_failed", request_id=str(request_id), error=str(e))
            raise DatabaseError(f"Failed to retrieve ingestion request: {str(e)}")
    
    async def update_status(
        self,
        request_id: UUID,
        status: IngestionStatus,
        message: Optional[str] = None,
        error_details: Optional[dict] = None
    ) -> None:
        """Update ingestion request status."""
        try:
            values = {"status": status, "updated_at": datetime.utcnow()}
            
            if message:
                values["message"] = message
            
            if error_details:
                values["error_details"] = error_details
            
            if status == IngestionStatus.COMPLETED:
                values["completed_at"] = datetime.utcnow()
            
            await self.session.execute(
                update(IngestionRequest)
                .where(IngestionRequest.id == request_id)
                .values(**values)
            )
            
            await self.session.commit()
            
            logger.info("ingestion_request_status_updated", request_id=str(request_id), status=status.value)
            
        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error("ingestion_request_status_update_failed", request_id=str(request_id), error=str(e))
            raise DatabaseError(f"Failed to update ingestion request status: {str(e)}")
    
    async def list_by_camera(
        self,
        camera_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[IngestionRequest]:
        """List ingestion requests for a camera."""
        try:
            result = await self.session.execute(
                select(IngestionRequest)
                .where(IngestionRequest.camera_id == camera_id)
                .order_by(IngestionRequest.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            logger.error("ingestion_request_listing_failed", camera_id=camera_id, error=str(e))
            raise DatabaseError(f"Failed to list ingestion requests: {str(e)}")


class FrameRepository:
    """Repository for frame operations."""
    
    def __init__(self, session: AsyncSession):
        """
        Initialize repository with database session.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    async def create(
        self,
        request_id: UUID,
        camera_id: str,
        source_type: SourceType,
        storage_path: str,
        storage_bucket: str,
        storage_url: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        size_bytes: Optional[int] = None,
        format: Optional[str] = None,
        capture_timestamp: Optional[datetime] = None,
        exposure: Optional[float] = None,
        sensor_info: Optional[dict] = None,
        meta_info: Optional[dict] = None
    ) -> Frame:
        """
        Create new frame record.
        
        Returns:
            Created Frame entity
            
        Raises:
            DatabaseError: If creation fails
        """
        try:
            frame = Frame(
                request_id=request_id,
                camera_id=camera_id,
                source_type=source_type,
                storage_path=storage_path,
                storage_bucket=storage_bucket,
                storage_url=storage_url,
                width=width,
                height=height,
                size_bytes=size_bytes,
                format=format,
                capture_timestamp=capture_timestamp or datetime.utcnow(),
                exposure=exposure,
                sensor_info=sensor_info,
                meta_info=meta_info
            )
            
            self.session.add(frame)
            await self.session.commit()
            await self.session.refresh(frame)
            
            logger.info("frame_created", frame_id=str(frame.id), camera_id=camera_id)
            
            return frame
            
        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error("frame_creation_failed", camera_id=camera_id, error=str(e))
            raise DatabaseError(
                f"Failed to create frame record: {str(e)}",
                details={"camera_id": camera_id, "request_id": str(request_id)}
            )
    
    async def get_by_id(self, frame_id: UUID) -> Optional[Frame]:
        """Get frame by ID."""
        try:
            result = await self.session.execute(
                select(Frame).where(Frame.id == frame_id)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("frame_retrieval_failed", frame_id=str(frame_id), error=str(e))
            raise DatabaseError(f"Failed to retrieve frame: {str(e)}")
    
    async def list_by_request(self, request_id: UUID) -> List[Frame]:
        """List all frames for an ingestion request."""
        try:
            result = await self.session.execute(
                select(Frame)
                .where(Frame.request_id == request_id)
                .order_by(Frame.capture_timestamp.asc())
            )
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            logger.error("frame_listing_failed", request_id=str(request_id), error=str(e))
            raise DatabaseError(f"Failed to list frames: {str(e)}")
    
    async def list_by_camera(
        self,
        camera_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Frame]:
        """List frames for a camera with optional date filtering."""
        try:
            query = select(Frame).where(Frame.camera_id == camera_id)
            
            if start_date:
                query = query.where(Frame.capture_timestamp >= start_date)
            
            if end_date:
                query = query.where(Frame.capture_timestamp <= end_date)
            
            query = query.order_by(Frame.capture_timestamp.desc()).limit(limit).offset(offset)
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            logger.error("frame_listing_by_camera_failed", camera_id=camera_id, error=str(e))
            raise DatabaseError(f"Failed to list frames by camera: {str(e)}")
    
    async def delete(self, frame_id: UUID) -> None:
        """Delete frame record."""
        try:
            await self.session.execute(
                delete(Frame).where(Frame.id == frame_id)
            )
            await self.session.commit()
            logger.info("frame_deleted", frame_id=str(frame_id))
        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error("frame_deletion_failed", frame_id=str(frame_id), error=str(e))
            raise DatabaseError(f"Failed to delete frame: {str(e)}")


class CameraConfigRepository:
    """Repository for camera configuration operations."""
    
    def __init__(self, session: AsyncSession):
        """
        Initialize repository with database session.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    async def create_or_update(
        self,
        camera_id: str,
        name: str,
        description: Optional[str] = None,
        location: Optional[str] = None,
        rtsp_url: Optional[str] = None,
        rtsp_username: Optional[str] = None,
        rtsp_password: Optional[str] = None,
        default_fps: Optional[float] = None,
        resolution_width: Optional[int] = None,
        resolution_height: Optional[int] = None,
        calibration_data: Optional[dict] = None,
        meta_info: Optional[dict] = None,
        is_active: bool = True
    ) -> CameraConfiguration:
        """Create or update camera configuration."""
        try:
            # Check if exists
            result = await self.session.execute(
                select(CameraConfiguration).where(CameraConfiguration.camera_id == camera_id)
            )
            camera_config = result.scalar_one_or_none()
            
            if camera_config:
                # Update existing
                camera_config.name = name
                camera_config.description = description
                camera_config.location = location
                camera_config.rtsp_url = rtsp_url
                camera_config.rtsp_username = rtsp_username
                camera_config.rtsp_password = rtsp_password
                camera_config.default_fps = default_fps
                camera_config.resolution_width = resolution_width
                camera_config.resolution_height = resolution_height
                camera_config.calibration_data = calibration_data
                camera_config.meta_info = meta_info
                camera_config.is_active = 1 if is_active else 0
                camera_config.updated_at = datetime.utcnow()
            else:
                # Create new
                camera_config = CameraConfiguration(
                    camera_id=camera_id,
                    name=name,
                    description=description,
                    location=location,
                    rtsp_url=rtsp_url,
                    rtsp_username=rtsp_username,
                    rtsp_password=rtsp_password,
                    default_fps=default_fps,
                    resolution_width=resolution_width,
                    resolution_height=resolution_height,
                    calibration_data=calibration_data,
                    meta_info=meta_info,
                    is_active=1 if is_active else 0
                )
                self.session.add(camera_config)
            
            await self.session.commit()
            await self.session.refresh(camera_config)
            
            logger.info("camera_config_saved", camera_id=camera_id)
            
            return camera_config
            
        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error("camera_config_save_failed", camera_id=camera_id, error=str(e))
            raise DatabaseError(f"Failed to save camera configuration: {str(e)}")
    
    async def get_by_id(self, camera_id: str) -> Optional[CameraConfiguration]:
        """Get camera configuration by ID."""
        try:
            result = await self.session.execute(
                select(CameraConfiguration).where(CameraConfiguration.camera_id == camera_id)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error("camera_config_retrieval_failed", camera_id=camera_id, error=str(e))
            raise DatabaseError(f"Failed to retrieve camera configuration: {str(e)}")
    
    async def list_active(self) -> List[CameraConfiguration]:
        """List all active camera configurations."""
        try:
            result = await self.session.execute(
                select(CameraConfiguration)
                .where(CameraConfiguration.is_active == 1)
                .order_by(CameraConfiguration.name.asc())
            )
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            logger.error("camera_config_listing_failed", error=str(e))
            raise DatabaseError(f"Failed to list camera configurations: {str(e)}")
