@echo off
REM Quick test script for Windows to capture test images and test ingestion

echo ================================
echo TrackShift Ingestion Test Script
echo ================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python first.
    exit /b 1
)

REM Check if service is running
echo Checking if ingestion service is running...
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Ingestion service not responding at http://localhost:8000
    echo Please start the service first: docker-compose up -d
    echo.
    pause
)

echo.
echo Select test option:
echo 1. Capture test images from webcam
echo 2. Test upload with existing images
echo 3. Test RTSP capture (requires RTSP server)
echo 4. Run all tests
echo.

set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto capture
if "%choice%"=="2" goto upload
if "%choice%"=="3" goto rtsp
if "%choice%"=="4" goto all
goto end

:capture
echo.
echo === Capturing Test Images ===
python test_rtsp_server.py
goto end

:upload
echo.
echo === Testing Upload Endpoint ===
if not exist "test_images\test_image_001.jpg" (
    echo ERROR: No test images found. Run option 1 first to capture images.
    goto end
)

echo Uploading test images...
curl -X POST "http://localhost:8000/api/v1/ingest/upload" ^
  -F "camera_id=test_webcam" ^
  -F "files=@test_images/test_image_001.jpg" ^
  -F "files=@test_images/test_image_002.jpg" ^
  -F "meta={\"session\":\"test\",\"location\":\"local\"}"

echo.
echo Upload test completed!
goto end

:rtsp
echo.
echo === Testing RTSP Endpoint ===
echo.
echo Make sure MediaMTX is running: docker run -d -p 8554:8554 bluenviron/mediamtx
echo And streaming: ffmpeg -f dshow -i video="Integrated Camera" -f rtsp rtsp://localhost:8554/webcam
echo.
pause

curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" ^
  -H "Content-Type: application/json" ^
  -d "{\"rtsp_url\":\"rtsp://localhost:8554/webcam\",\"camera_id\":\"test_webcam\",\"capture_mode\":\"single_frame\",\"meta\":{\"session\":\"test\",\"location\":\"local\"}}"

echo.
echo RTSP test completed!
goto end

:all
echo.
echo === Running All Tests ===
echo.
echo 1. Capturing images...
python test_rtsp_server.py
echo.
echo 2. Testing upload...
call :upload
echo.
echo 3. Testing RTSP...
call :rtsp
echo.
echo All tests completed!
goto end

:end
echo.
echo ================================
echo.
echo Check results:
echo - API Docs: http://localhost:8000/docs
echo - Health: http://localhost:8000/health
echo - Logs: docker-compose logs ingestion
echo.
pause
