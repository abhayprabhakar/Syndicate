# RTSP Test Server Setup Guide

## Quick Start Options

### Option 1: Simple Webcam Test (Easiest)
Test your webcam and capture images for upload testing:

```bash
# Install OpenCV
pip install opencv-python

# Run the test script
python test_rtsp_server.py
# Select option 3 to capture test images
```

### Option 2: Full RTSP Server with MediaMTX (Recommended)

MediaMTX is a lightweight, easy-to-use RTSP server.

#### Using Docker (Easiest):
```bash
# Start MediaMTX RTSP server
docker run -d --name mediamtx -p 8554:8554 bluenviron/mediamtx

# The server is now running at rtsp://localhost:8554/
```

#### Push webcam feed to MediaMTX:
```bash
# Windows (using DirectShow)
ffmpeg -f dshow -i video="Integrated Camera" ^
  -vcodec libx264 -preset ultrafast -tune zerolatency ^
  -f rtsp rtsp://localhost:8554/webcam

# Linux (using V4L2)
ffmpeg -f v4l2 -i /dev/video0 ^
  -vcodec libx264 -preset ultrafast -tune zerolatency ^
  -f rtsp rtsp://localhost:8554/webcam
```

#### Test the RTSP stream:
```bash
# Using VLC
vlc rtsp://localhost:8554/webcam

# Using FFplay
ffplay rtsp://localhost:8554/webcam

# Using the ingestion service
curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
  -H "Content-Type: application/json" \
  -d '{
    "rtsp_url": "rtsp://localhost:8554/webcam",
    "camera_id": "test_webcam",
    "capture_mode": "single_frame"
  }'
```

### Option 3: Using IP Camera Simulator

If you don't have a physical camera, use an IP camera simulator:

```bash
# Run IP Camera Simulator with Docker
docker run -d --name ipcam-simulator -p 8080:8080 ullaakut/camerdar

# Or use EasyDarwin
docker run -d --name rtsp-server -p 554:554 penggy/easydarwin
```

## Windows-Specific Setup

### Find Your Camera Name:
```powershell
# List available cameras
ffmpeg -list_devices true -f dshow -i dummy
```

### Stream from specific camera:
```powershell
ffmpeg -f dshow -i video="Your Camera Name" `
  -vcodec libx264 -preset ultrafast `
  -f rtsp rtsp://localhost:8554/webcam
```

## Testing the Ingestion Service

### 1. Test with captured images (no RTSP needed):
```bash
# Capture test images
python test_rtsp_server.py
# Select option 3

# Upload to ingestion service
curl -X POST "http://localhost:8000/api/v1/ingest/upload" \
  -F "camera_id=test_webcam" \
  -F "files=@test_images/test_image_001.jpg" \
  -F "files=@test_images/test_image_002.jpg"
```

### 2. Test with RTSP stream:
```bash
# Make sure MediaMTX is running and streaming
# Then test ingestion
curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
  -H "Content-Type: application/json" \
  -d '{
    "rtsp_url": "rtsp://localhost:8554/webcam",
    "camera_id": "test_webcam",
    "capture_mode": "single_frame",
    "meta": {
      "session": "test",
      "location": "local"
    }
  }'
```

### 3. Check ingestion status:
```bash
# Get the request_id from the response above, then:
curl -X GET "http://localhost:8000/api/v1/ingest/status/{request_id}"
```

## Complete Docker Compose Setup

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  # MediaMTX RTSP Server
  mediamtx:
    image: bluenviron/mediamtx
    container_name: test-rtsp-server
    ports:
      - "8554:8554"
    restart: unless-stopped

  # Ingestion Service (from main docker-compose.yml)
  ingestion:
    # ... your ingestion service config
    depends_on:
      - mediamtx
```

Run:
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

## Troubleshooting

### Camera not found:
```powershell
# Windows: Check Device Manager > Cameras
# Ensure camera is not being used by another application
```

### RTSP connection timeout:
- Check firewall settings
- Ensure MediaMTX/RTSP server is running: `docker ps`
- Test RTSP URL with VLC first

### FFmpeg errors:
```bash
# Install FFmpeg
# Windows (with Chocolatey)
choco install ffmpeg

# Linux
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

## Alternative: Use OBS Studio

1. Install OBS Studio
2. Add Video Capture Device (your webcam)
3. Settings > Stream > Custom
4. Server: `rtsp://localhost:8554/webcam`
5. Start Streaming

## Public Test RTSP Streams

For testing without local camera:

```bash
# Big Buck Bunny (sample video)
rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4

# Test with ingestion service
curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
  -H "Content-Type: application/json" \
  -d '{
    "rtsp_url": "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4",
    "camera_id": "test_demo",
    "capture_mode": "single_frame"
  }'
```

## Quick Test Script

```bash
# test_ingestion.sh
#!/bin/bash

echo "Testing ingestion service..."

# Test 1: Health check
echo "1. Health check..."
curl http://localhost:8000/health

# Test 2: Upload test
echo -e "\n\n2. Testing upload..."
python test_rtsp_server.py  # Capture images first
curl -X POST "http://localhost:8000/api/v1/ingest/upload" \
  -F "camera_id=test" \
  -F "files=@test_images/test_image_001.jpg"

# Test 3: RTSP test (requires MediaMTX running)
echo -e "\n\n3. Testing RTSP..."
curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
  -H "Content-Type: application/json" \
  -d '{
    "rtsp_url": "rtsp://localhost:8554/webcam",
    "camera_id": "test",
    "capture_mode": "single_frame"
  }'

echo -e "\n\nDone!"
```

## Recommended Setup

For easiest testing:

1. **Start with image capture** (no RTSP needed):
   ```bash
   python test_rtsp_server.py
   # Select option 3, capture images
   # Test upload endpoint
   ```

2. **Then add RTSP** when ready:
   ```bash
   docker run -d -p 8554:8554 bluenviron/mediamtx
   # Stream with FFmpeg or test with public streams
   ```

3. **Monitor in real-time**:
   - API docs: http://localhost:8000/docs
   - Logs: `docker-compose logs -f ingestion`
   - Metrics: http://localhost:8000/metrics
