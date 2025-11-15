@echo off
REM Windows batch script to set up and test RTSP streaming

echo ================================================
echo TrackShift RTSP Streaming Setup for Windows
echo ================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    echo.
    pause
    exit /b 1
)

echo Select option:
echo 1. Start MediaMTX RTSP Server
echo 2. Stream webcam to RTSP (after starting server)
echo 3. Test RTSP stream with VLC
echo 4. Stop MediaMTX server
echo 5. Complete setup (server + stream)
echo.

set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto stream_webcam
if "%choice%"=="3" goto test_stream
if "%choice%"=="4" goto stop_server
if "%choice%"=="5" goto complete_setup
goto end

:start_server
echo.
echo === Starting MediaMTX RTSP Server ===
echo.

REM Stop existing container if running
docker stop mediamtx >nul 2>&1
docker rm mediamtx >nul 2>&1

REM Start MediaMTX with configuration
if exist mediamtx.yml (
    echo Using custom configuration...
    docker run -d --name mediamtx ^
        -p 8554:8554 ^
        -v "%cd%\mediamtx.yml:/mediamtx.yml" ^
        bluenviron/mediamtx
) else (
    echo Using default configuration...
    docker run -d --name mediamtx ^
        -p 8554:8554 ^
        bluenviron/mediamtx
)

if errorlevel 1 (
    echo ERROR: Failed to start MediaMTX server
    goto end
)

echo.
echo ✅ MediaMTX RTSP server started successfully!
echo 📡 Server running at: rtsp://localhost:8554
echo.
echo Waiting 3 seconds for server to initialize...
timeout /t 3 /nobreak >nul
echo.
echo Server is ready! You can now stream to it.
echo Run this script again and select option 2 to start streaming.
goto end

:stream_webcam
echo.
echo === Streaming Webcam to RTSP Server ===
echo.

REM Check if MediaMTX is running
docker ps | findstr mediamtx >nul 2>&1
if errorlevel 1 (
    echo ERROR: MediaMTX server is not running.
    echo Please start it first (option 1).
    goto end
)

echo Finding available cameras...
echo.
echo Run this command first to see your cameras:
echo   ffmpeg -list_devices true -f dshow -i dummy
echo.
echo Common camera names:
echo   - "Integrated Camera"
echo   - "USB Video Device"
echo   - "HD WebCam"
echo.

set /p camera_name="Enter your camera name (or press Enter for 'Integrated Camera'): "
if "%camera_name%"=="" set camera_name=Integrated Camera

echo.
echo Starting stream from "%camera_name%" to rtsp://localhost:8554/webcam
echo Press Ctrl+C to stop streaming
echo.

REM Stream with better settings for stability
ffmpeg -f dshow -video_size 640x480 -framerate 15 -i video="%camera_name%" ^
    -c:v libx264 -preset ultrafast -tune zerolatency ^
    -b:v 500k -maxrate 500k -bufsize 1000k ^
    -g 15 -keyint_min 15 -sc_threshold 0 ^
    -pix_fmt yuv420p ^
    -rtsp_transport tcp ^
    -f rtsp rtsp://localhost:8554/webcam

goto end

:test_stream
echo.
echo === Testing RTSP Stream ===
echo.

REM Check if VLC is installed
where vlc >nul 2>&1
if errorlevel 1 (
    echo VLC not found in PATH. 
    echo Please install VLC or open this URL manually:
    echo.
    echo   rtsp://localhost:8554/webcam
    echo.
    echo You can also test with ffplay:
    echo   ffplay -rtsp_transport tcp rtsp://localhost:8554/webcam
) else (
    echo Opening stream in VLC...
    start vlc rtsp://localhost:8554/webcam
)

echo.
echo Stream URL: rtsp://localhost:8554/webcam
goto end

:stop_server
echo.
echo === Stopping MediaMTX Server ===
docker stop mediamtx
docker rm mediamtx
echo.
echo ✅ Server stopped
goto end

:complete_setup
echo.
echo === Complete Setup ===
echo.
echo This will:
echo 1. Start MediaMTX RTSP server
echo 2. Wait for server to be ready
echo 3. Start streaming from webcam
echo.

call :start_server

echo.
echo Server is ready. Starting webcam stream...
timeout /t 2 /nobreak >nul
echo.

call :stream_webcam

goto end

:end
echo.
echo ================================================
echo.
echo Quick reference:
echo - Server URL: rtsp://localhost:8554
echo - Stream path: /webcam
echo - Full URL: rtsp://localhost:8554/webcam
echo.
echo Test with ingestion service:
echo   curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
echo     -H "Content-Type: application/json" \
echo     -d "{ \"rtsp_url\": \"rtsp://localhost:8554/webcam\", \"camera_id\": \"test\", \"capture_mode\": \"single_frame\" }"
echo.
pause
