"""
Pytest configuration and fixtures.
"""
import pytest
import asyncio
from pathlib import Path


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir(tmp_path):
    """Provide a temporary directory for tests."""
    return tmp_path


@pytest.fixture
def sample_image_path(temp_dir):
    """Create a sample test image."""
    from PIL import Image
    
    img = Image.new('RGB', (640, 480), color='red')
    img_path = temp_dir / "test_image.jpg"
    img.save(img_path)
    
    return img_path


@pytest.fixture
def mock_camera_id():
    """Provide a mock camera ID."""
    return "test_camera_001"
