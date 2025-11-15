@echo off
REM Simple script to stream webcam - run after MediaMTX is started

echo Streaming webcam to RTSP server...
echo URL: rtsp://localhost:8554/webcam
echo Press Ctrl+C to stop
echo.

REM Simpler FFmpeg command with reduced quality for stability
ffmpeg -f dshow -video_size 640x480 -framerate 15 -rtbufsize 100M ^
    -i video="Integrated Camera" ^
    -c:v libx264 -preset ultrafast -tune zerolatency ^
    -b:v 400k -maxrate 400k -bufsize 800k ^
    -g 15 -pix_fmt yuv420p ^
    -f rtsp -rtsp_transport tcp ^
    rtsp://localhost:8554/webcam

pause
