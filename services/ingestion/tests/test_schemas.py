"""
Unit tests for Pydantic schemas and models.
"""
import pytest
from datetime import datetime
from pydantic import ValidationError

from models.schemas import (
    SourceType, CaptureMode, IngestionStatus,
    RTSPIngestionRequest, UploadIngestionRequest,
    FrameInfo, IngestionResponse
)


def test_rtsp_ingestion_request_valid():
    """Test valid RTSP ingestion request."""
    request = RTSPIngestionRequest(
        rtsp_url="rtsp://user:pass@camera:554/stream",
        camera_id="test_camera",
        capture_mode=CaptureMode.SINGLE_FRAME
    )
    
    assert request.source_type == SourceType.RTSP
    assert request.camera_id == "test_camera"
    assert request.capture_mode == CaptureMode.SINGLE_FRAME


def test_rtsp_ingestion_request_invalid_url():
    """Test RTSP request with invalid URL."""
    with pytest.raises(ValidationError):
        RTSPIngestionRequest(
            rtsp_url="http://invalid:554/stream",  # Should start with rtsp://
            camera_id="test_camera"
        )


def test_upload_ingestion_request():
    """Test upload ingestion request."""
    request = UploadIngestionRequest(
        camera_id="test_camera"
    )
    
    assert request.source_type == SourceType.UPLOAD
    assert request.camera_id == "test_camera"


def test_frame_info_creation():
    """Test FrameInfo model."""
    frame = FrameInfo(
        storage_path="frames/2025/11/15/test/frame_123.jpg",
        width=1920,
        height=1080,
        size_bytes=245678,
        format="jpg"
    )
    
    assert frame.storage_path == "frames/2025/11/15/test/frame_123.jpg"
    assert frame.width == 1920
    assert frame.height == 1080


def test_ingestion_response():
    """Test IngestionResponse model."""
    response = IngestionResponse(
        status=IngestionStatus.COMPLETED,
        camera_id="test_camera",
        source_type=SourceType.UPLOAD,
        frames=[],
        message="Success"
    )
    
    assert response.status == IngestionStatus.COMPLETED
    assert response.camera_id == "test_camera"
    assert len(response.frames) == 0
