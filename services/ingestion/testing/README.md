# Testing Utilities for TrackShift Ingestion Service

This folder contains utilities and scripts for testing the ingestion service with local cameras and RTSP streams.

## Contents

### Scripts
- **`test_rtsp_server.py`** - Python script for webcam testing with 3 modes:
  - Simple webcam preview
  - RTSP server setup guidance
  - Capture test images for upload testing

- **`test_ingestion.bat`** - Windows batch script for automated testing
- **`test_ingestion.sh`** - Linux/Mac bash script for automated testing

### Documentation
- **`RTSP_TEST_SETUP.md`** - Comprehensive guide for setting up RTSP testing

## Quick Start

### 1. Capture Test Images (Easiest)
```bash
cd testing
python test_rtsp_server.py
# Select option 3, press SPACE to capture images
```

### 2. Run Automated Tests
**Windows:**
```powershell
cd testing
.\test_ingestion.bat
```

**Linux/Mac:**
```bash
cd testing
chmod +x test_ingestion.sh
./test_ingestion.sh
```

### 3. Test Upload Endpoint
```bash
curl -X POST "http://localhost:8000/api/v1/ingest/upload" \
  -F "camera_id=test_webcam" \
  -F "files=@test_images/test_image_001.jpg" \
  -F "files=@test_images/test_image_002.jpg"
```

## RTSP Server Setup

### Using MediaMTX (Recommended)
```bash
# Start RTSP server
docker run -d --name mediamtx -p 8554:8554 bluenviron/mediamtx

# Stream webcam (Windows)
ffmpeg -f dshow -i video="Integrated Camera" \
  -vcodec libx264 -preset ultrafast \
  -f rtsp rtsp://localhost:8554/webcam

# Test with ingestion service
curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
  -H "Content-Type: application/json" \
  -d '{
    "rtsp_url": "rtsp://localhost:8554/webcam",
    "camera_id": "test_webcam",
    "capture_mode": "single_frame"
  }'
```

## Output

Test images will be saved to:
```
testing/test_images/
  ├── test_image_001.jpg
  ├── test_image_002.jpg
  └── ...
```

## Requirements

```bash
pip install opencv-python
```

For full RTSP testing:
- FFmpeg
- Docker (for MediaMTX)

See `RTSP_TEST_SETUP.md` for detailed setup instructions.
