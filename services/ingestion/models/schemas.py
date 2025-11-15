"""
Pydantic models for request/response validation and data contracts.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, HttpUrl, field_validator, ConfigDict


class SourceType(str, Enum):
    """Source type for ingestion."""
    UPLOAD = "upload"
    RTSP = "rtsp"


class CaptureMode(str, Enum):
    """Capture mode for RTSP streams."""
    SINGLE_FRAME = "single_frame"
    CONTINUOUS = "continuous"
    EVENT_DRIVEN = "event_driven"


class IngestionStatus(str, Enum):
    """Status of ingestion request."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Request Models
class FrameMetadata(BaseModel):
    """Metadata for a captured frame."""
    session: Optional[str] = Field(None, description="Session identifier (e.g., FP1, Race)")
    timestamp_ref: Optional[datetime] = Field(None, description="Reference timestamp")
    location: Optional[str] = Field(None, description="Physical location")
    camera_angle: Optional[str] = Field(None, description="Camera angle description")
    exposure: Optional[float] = Field(None, description="Exposure value", ge=0)
    sensor_info: Optional[dict[str, Any]] = Field(None, description="Additional sensor metadata")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "session": "FP1",
            "timestamp_ref": "2025-11-15T12:05:00+05:30",
            "location": "Pit Lane",
            "camera_angle": "front_45deg"
        }
    })


class UploadIngestionRequest(BaseModel):
    """Request model for manual image upload ingestion."""
    source_type: SourceType = Field(SourceType.UPLOAD, description="Must be 'upload'")
    camera_id: str = Field(..., description="Unique camera/source identifier", min_length=1, max_length=100)
    meta: Optional[FrameMetadata] = Field(None, description="Additional frame metadata")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "source_type": "upload",
            "camera_id": "Haas_Pit_1",
            "meta": {
                "session": "FP1",
                "timestamp_ref": "2025-11-15T12:05:00+05:30"
            }
        }
    })


class RTSPIngestionRequest(BaseModel):
    """Request model for RTSP stream ingestion."""
    source_type: SourceType = Field(SourceType.RTSP, description="Must be 'rtsp'")
    rtsp_url: str = Field(..., description="RTSP stream URL", min_length=1)
    camera_id: str = Field(..., description="Unique camera identifier", min_length=1, max_length=100)
    capture_mode: CaptureMode = Field(CaptureMode.SINGLE_FRAME, description="Capture mode")
    frame_timestamp: Optional[datetime] = Field(None, description="Specific frame timestamp to capture")
    capture_duration: Optional[int] = Field(None, description="Capture duration in seconds (for continuous mode)", gt=0, le=3600)
    fps: Optional[float] = Field(None, description="Frames per second to capture", gt=0, le=30)
    meta: Optional[FrameMetadata] = Field(None, description="Additional frame metadata")
    
    @field_validator("rtsp_url")
    @classmethod
    def validate_rtsp_url(cls, v: str) -> str:
        """Validate RTSP URL format."""
        if not v.startswith(("rtsp://", "rtsps://")):
            raise ValueError("URL must start with rtsp:// or rtsps://")
        return v
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "source_type": "rtsp",
            "rtsp_url": "rtsp://user:pass@10.0.0.5:554/stream",
            "camera_id": "Haas_Pit_1",
            "capture_mode": "single_frame",
            "frame_timestamp": "2025-11-15T12:05:00+05:30",
            "meta": {
                "session": "FP1",
                "location": "Pit Lane"
            }
        }
    })


# Response Models
class FrameInfo(BaseModel):
    """Information about a captured frame."""
    frame_id: UUID = Field(default_factory=uuid4, description="Unique frame identifier")
    storage_path: str = Field(..., description="Storage path in S3/MinIO")
    storage_url: Optional[str] = Field(None, description="Presigned URL for frame access")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Capture timestamp")
    width: Optional[int] = Field(None, description="Frame width in pixels", gt=0)
    height: Optional[int] = Field(None, description="Frame height in pixels", gt=0)
    size_bytes: Optional[int] = Field(None, description="File size in bytes", ge=0)
    format: Optional[str] = Field(None, description="Image format (jpg, png, etc.)")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "frame_id": "550e8400-e29b-41d4-a716-446655440000",
            "storage_path": "frames/2025/11/15/Haas_Pit_1/frame_123.jpg",
            "timestamp": "2025-11-15T12:05:00Z",
            "width": 1920,
            "height": 1080,
            "size_bytes": 245678,
            "format": "jpg"
        }
    })


class IngestionResponse(BaseModel):
    """Response model for ingestion requests."""
    request_id: UUID = Field(default_factory=uuid4, description="Unique request identifier")
    status: IngestionStatus = Field(..., description="Request status")
    camera_id: str = Field(..., description="Camera identifier")
    source_type: SourceType = Field(..., description="Source type")
    frames: list[FrameInfo] = Field(default_factory=list, description="Captured frames")
    message: Optional[str] = Field(None, description="Status message or error details")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Request creation time")
    completed_at: Optional[datetime] = Field(None, description="Request completion time")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "request_id": "123e4567-e89b-12d3-a456-426614174000",
            "status": "completed",
            "camera_id": "Haas_Pit_1",
            "source_type": "upload",
            "frames": [
                {
                    "frame_id": "550e8400-e29b-41d4-a716-446655440000",
                    "storage_path": "frames/2025/11/15/Haas_Pit_1/frame_123.jpg",
                    "timestamp": "2025-11-15T12:05:00Z",
                    "width": 1920,
                    "height": 1080,
                    "size_bytes": 245678,
                    "format": "jpg"
                }
            ],
            "message": "Successfully ingested 1 frame(s)",
            "created_at": "2025-11-15T12:05:00Z",
            "completed_at": "2025-11-15T12:05:02Z"
        }
    })


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    version: str = Field(..., description="Service version")
    dependencies: dict[str, str] = Field(default_factory=dict, description="Dependency health status")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "healthy",
            "timestamp": "2025-11-15T12:05:00Z",
            "version": "1.0.0",
            "dependencies": {
                "database": "healthy",
                "storage": "healthy",
                "redis": "healthy"
            }
        }
    })


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[dict[str, Any]] = Field(None, description="Additional error details")
    request_id: Optional[UUID] = Field(None, description="Request identifier for tracking")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "error": "ValidationError",
            "message": "Invalid RTSP URL format",
            "details": {"field": "rtsp_url", "reason": "URL must start with rtsp://"},
            "timestamp": "2025-11-15T12:05:00Z"
        }
    })
