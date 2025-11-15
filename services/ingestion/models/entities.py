"""
Database entities (SQLAlchemy models) for persistent storage.
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, Enum as SQLEnum, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

from .schemas import SourceType, IngestionStatus

Base = declarative_base()


class IngestionRequest(Base):
    """Ingestion request entity."""
    __tablename__ = "ingestion_requests"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    
    # Request details
    camera_id = Column(String(100), nullable=False, index=True)
    source_type = Column(SQLEnum(SourceType), nullable=False, index=True)
    status = Column(SQLEnum(IngestionStatus), nullable=False, default=IngestionStatus.PENDING, index=True)
    
    # RTSP-specific fields
    rtsp_url = Column(Text, nullable=True)
    capture_mode = Column(String(50), nullable=True)
    capture_duration = Column(Integer, nullable=True)
    fps = Column(Float, nullable=True)
    
    # Metadata
    meta_info = Column(JSON, nullable=True)
    
    # Status tracking
    message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_camera_created", "camera_id", "created_at"),
        Index("idx_status_created", "status", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<IngestionRequest(id={self.id}, camera_id={self.camera_id}, status={self.status})>"


class Frame(Base):
    """Frame entity representing a captured image."""
    __tablename__ = "frames"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    
    # Foreign key to ingestion request
    request_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Camera and source info
    camera_id = Column(String(100), nullable=False, index=True)
    source_type = Column(SQLEnum(SourceType), nullable=False)
    
    # Storage information
    storage_path = Column(Text, nullable=False)
    storage_bucket = Column(String(255), nullable=False)
    storage_url = Column(Text, nullable=True)
    
    # Frame properties
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    format = Column(String(10), nullable=True)
    
    # Capture metadata
    capture_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    exposure = Column(Float, nullable=True)
    sensor_info = Column(JSON, nullable=True)
    
    # Additional metadata
    meta_info = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_camera_capture_timestamp", "camera_id", "capture_timestamp"),
        Index("idx_request_created", "request_id", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<Frame(id={self.id}, camera_id={self.camera_id}, storage_path={self.storage_path})>"


class CameraConfiguration(Base):
    """Camera configuration entity."""
    __tablename__ = "camera_configurations"
    
    # Primary key
    camera_id = Column(String(100), primary_key=True)
    
    # Camera details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    
    # RTSP configuration (if applicable)
    rtsp_url = Column(Text, nullable=True)
    rtsp_username = Column(String(255), nullable=True)
    rtsp_password = Column(String(255), nullable=True)  # Should be encrypted in production
    
    # Camera settings
    default_fps = Column(Float, nullable=True)
    resolution_width = Column(Integer, nullable=True)
    resolution_height = Column(Integer, nullable=True)
    
    # Calibration data
    calibration_data = Column(JSON, nullable=True)  # Intrinsics, distortion coefficients, etc.
    
    # Status
    is_active = Column(Integer, default=1, nullable=False)  # Using Integer for SQLite compatibility
    
    # Additional metadata
    meta_info = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return f"<CameraConfiguration(camera_id={self.camera_id}, name={self.name}, is_active={self.is_active})>"
