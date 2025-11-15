#!/bin/bash
# Quick test script for Linux/Mac to test ingestion service

set -e

echo "================================"
echo "TrackShift Ingestion Test Script"
echo "================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python not found. Please install Python first."
    exit 1
fi

# Check if service is running
echo "Checking if ingestion service is running..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "WARNING: Ingestion service not responding at http://localhost:8000"
    echo "Please start the service first: docker-compose up -d"
    echo ""
    read -p "Press enter to continue anyway..."
fi

echo ""
echo "Select test option:"
echo "1. Capture test images from webcam"
echo "2. Test upload with existing images"
echo "3. Test RTSP capture (requires RTSP server)"
echo "4. Run all tests"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "=== Capturing Test Images ==="
        python3 test_rtsp_server.py
        ;;
    2)
        echo ""
        echo "=== Testing Upload Endpoint ==="
        if [ ! -f "test_images/test_image_001.jpg" ]; then
            echo "ERROR: No test images found. Run option 1 first to capture images."
            exit 1
        fi
        
        echo "Uploading test images..."
        curl -X POST "http://localhost:8000/api/v1/ingest/upload" \
          -F "camera_id=test_webcam" \
          -F "files=@test_images/test_image_001.jpg" \
          -F "files=@test_images/test_image_002.jpg" \
          -F 'meta={"session":"test","location":"local"}'
        
        echo ""
        echo "Upload test completed!"
        ;;
    3)
        echo ""
        echo "=== Testing RTSP Endpoint ==="
        echo ""
        echo "Make sure MediaMTX is running: docker run -d -p 8554:8554 bluenviron/mediamtx"
        echo "And streaming: ffmpeg -f v4l2 -i /dev/video0 -f rtsp rtsp://localhost:8554/webcam"
        echo ""
        read -p "Press enter to continue..."
        
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
        
        echo ""
        echo "RTSP test completed!"
        ;;
    4)
        echo ""
        echo "=== Running All Tests ==="
        
        echo ""
        echo "1. Health check..."
        curl -s http://localhost:8000/health | python3 -m json.tool
        
        echo ""
        echo "2. Capturing images..."
        python3 test_rtsp_server.py
        
        if [ -f "test_images/test_image_001.jpg" ]; then
            echo ""
            echo "3. Testing upload..."
            curl -X POST "http://localhost:8000/api/v1/ingest/upload" \
              -F "camera_id=test_webcam" \
              -F "files=@test_images/test_image_001.jpg" \
              -F "files=@test_images/test_image_002.jpg" \
              -F 'meta={"session":"test","location":"local"}'
        fi
        
        echo ""
        echo "All tests completed!"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo ""
echo "Check results:"
echo "- API Docs: http://localhost:8000/docs"
echo "- Health: http://localhost:8000/health"
echo "- Logs: docker-compose logs ingestion"
echo ""
