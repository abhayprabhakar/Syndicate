@echo off
REM Test change detection (Step 5) integration
REM Enables change detection via environment variable

echo ========================================
echo Testing Change Detection (Step 5)
echo ========================================
echo.

echo Setting environment variable to enable change detection...
set SEGMENTATION_ENABLE_CHANGE_DETECTION=true
set SEGMENTATION_DEVICE=cpu

echo.
echo Running segmentation demo with change detection enabled...
echo (This may take 30-60 seconds for the first run as models load)
echo.

cd ..
python testing\run_segmentation_demo.py
cd testing

echo.
echo ========================================
echo Test Complete
echo ========================================
echo.
echo Check outputs/segmentation/ for:
echo   - change_detection_viz.png (visualization)
echo   - metadata.json (change count and stats)
echo.

pause
