"""
Simple RTSP server for testing using local webcam.
Streams webcam feed via RTSP protocol for testing the ingestion service.

Requirements:
    pip install opencv-python mediamtx (or use docker)

Usage:
    python test_rtsp_server.py
    
    Then connect to: rtsp://localhost:8554/webcam
"""
import cv2
import subprocess
import sys
import time
import threading
from pathlib import Path


class WebcamRTSPServer:
    """Simple RTSP server streaming from webcam."""
    
    def __init__(self, camera_index=0, rtsp_port=8554, stream_name="webcam"):
        """
        Initialize RTSP server.
        
        Args:
            camera_index: Camera index (0 for default webcam)
            rtsp_port: RTSP server port
            stream_name: Stream path name
        """
        self.camera_index = camera_index
        self.rtsp_port = rtsp_port
        self.stream_name = stream_name
        self.rtsp_url = f"rtsp://localhost:{rtsp_port}/{stream_name}"
        self.ffmpeg_process = None
        self.running = False
        
    def start_ffmpeg_rtsp_server(self):
        """
        Start FFmpeg as RTSP server.
        Note: This requires FFmpeg with RTSP server support.
        """
        # FFmpeg command to stream from webcam to RTSP
        # This pushes to an RTSP server (you need MediaMTX or similar)
        ffmpeg_cmd = [
            'ffmpeg',
            '-f', 'dshow' if sys.platform == 'win32' else 'v4l2',
            '-i', f'video={self._get_camera_device()}' if sys.platform == 'win32' else f'/dev/video{self.camera_index}',
            '-rtsp_transport', 'tcp',
            '-f', 'rtsp',
            f'rtsp://localhost:{self.rtsp_port}/{self.stream_name}'
        ]
        
        print(f"Starting FFmpeg RTSP server...")
        print(f"Command: {' '.join(ffmpeg_cmd)}")
        
        try:
            self.ffmpeg_process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.running = True
            print(f"✅ FFmpeg RTSP server started")
            print(f"📹 Stream URL: {self.rtsp_url}")
            
        except FileNotFoundError:
            print("❌ FFmpeg not found. Please install FFmpeg:")
            print("   Windows: choco install ffmpeg")
            print("   Linux: apt-get install ffmpeg")
            sys.exit(1)
    
    def _get_camera_device(self):
        """Get camera device name for Windows."""
        # For Windows, you might need to specify the exact camera name
        # Use: ffmpeg -list_devices true -f dshow -i dummy
        return "Integrated Camera"  # Common name, adjust as needed
    
    def stop(self):
        """Stop RTSP server."""
        self.running = False
        if self.ffmpeg_process:
            self.ffmpeg_process.terminate()
            self.ffmpeg_process.wait()
            print("RTSP server stopped")


class SimpleWebcamStreamer:
    """
    Alternative: Simple Python-based streamer using OpenCV.
    This creates a preview window and you can test capture separately.
    """
    
    def __init__(self, camera_index=0):
        """Initialize webcam streamer."""
        self.camera_index = camera_index
        self.cap = None
        self.running = False
        
    def start(self):
        """Start webcam preview."""
        print(f"Opening webcam (index: {self.camera_index})...")
        self.cap = cv2.VideoCapture(self.camera_index)
        
        if not self.cap.isOpened():
            print(f"❌ Failed to open webcam {self.camera_index}")
            sys.exit(1)
        
        # Set camera properties
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        
        print(f"✅ Webcam opened successfully")
        print(f"   Resolution: {width}x{height}")
        print(f"   FPS: {fps}")
        print(f"\nPress 'q' to quit")
        
        self.running = True
        self._stream_loop()
    
    def _stream_loop(self):
        """Main streaming loop with preview."""
        frame_count = 0
        
        while self.running:
            ret, frame = self.cap.read()
            
            if not ret:
                print("❌ Failed to read frame")
                break
            
            frame_count += 1
            
            # Add overlay info
            cv2.putText(
                frame,
                f"Frame: {frame_count}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )
            
            cv2.putText(
                frame,
                "Press 'q' to quit",
                (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2
            )
            
            # Show preview
            cv2.imshow('Webcam Test Stream', frame)
            
            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        self.stop()
    
    def stop(self):
        """Stop streaming."""
        self.running = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        print(f"\n✅ Webcam closed. Total frames: captured")


def check_dependencies():
    """Check if required dependencies are available."""
    # Check OpenCV
    try:
        import cv2
        print(f"✅ OpenCV installed: {cv2.__version__}")
    except ImportError:
        print("❌ OpenCV not found. Install: pip install opencv-python")
        return False
    
    # Check FFmpeg (optional)
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✅ FFmpeg installed: {version_line}")
    except FileNotFoundError:
        print("⚠️  FFmpeg not found (optional for RTSP server)")
        print("   For full RTSP support, install FFmpeg")
    
    return True


def main():
    """Main entry point."""
    print("=" * 60)
    print("TrackShift - Webcam RTSP Test Server")
    print("=" * 60)
    print()
    
    if not check_dependencies():
        sys.exit(1)
    
    print("\nSelect mode:")
    print("1. Simple webcam preview (test camera only)")
    print("2. RTSP server (requires MediaMTX/FFmpeg)")
    print("3. Save test images for upload testing")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        print("\n--- Starting Simple Webcam Preview ---")
        streamer = SimpleWebcamStreamer(camera_index=0)
        try:
            streamer.start()
        except KeyboardInterrupt:
            print("\n\nStopping...")
            streamer.stop()
    
    elif choice == "2":
        print("\n--- Starting RTSP Server ---")
        print("\n⚠️  This requires MediaMTX or similar RTSP server running.")
        print("Quick setup with Docker:")
        print("  docker run -p 8554:8554 bluenviron/mediamtx")
        print("\nThen use FFmpeg to push to it:")
        print("  ffmpeg -f dshow -i video=\"Integrated Camera\" -f rtsp rtsp://localhost:8554/webcam")
        print("\nOr use a pre-built RTSP server setup...")
        
    elif choice == "3":
        print("\n--- Capturing Test Images ---")
        capture_test_images()
    
    else:
        print("Invalid choice")


def capture_test_images(output_dir="test_images", count=5):
    """
    Capture test images from webcam for upload testing.
    
    Args:
        output_dir: Directory to save images
        count: Number of images to capture
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    print(f"\nCapturing {count} test images to {output_dir}/")
    print("Press SPACE to capture, 'q' to quit")
    
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Failed to open webcam")
        return
    
    captured = 0
    
    while captured < count:
        ret, frame = cap.read()
        
        if not ret:
            print("❌ Failed to read frame")
            break
        
        # Add info overlay
        cv2.putText(
            frame,
            f"Captured: {captured}/{count} - Press SPACE to capture",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )
        
        cv2.imshow('Capture Test Images', frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord(' '):  # Space to capture
            filename = output_path / f"test_image_{captured + 1:03d}.jpg"
            cv2.imwrite(str(filename), frame)
            print(f"✅ Saved: {filename}")
            captured += 1
            time.sleep(0.5)  # Brief pause
        
        elif key == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    
    print(f"\n✅ Captured {captured} images in {output_dir}/")
    print(f"\nYou can now test upload with:")
    print(f'  curl -X POST "http://localhost:8000/api/v1/ingest/upload" \\')
    print(f'    -F "camera_id=test_webcam" \\')
    print(f'    -F "files=@{output_dir}/test_image_001.jpg" \\')
    print(f'    -F "files=@{output_dir}/test_image_002.jpg"')


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit(0)
