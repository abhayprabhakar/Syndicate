"""
RTSP stream capture service using OpenCV and threading.
Handles real-time frame extraction from RTSP camera feeds.
"""
import time
from datetime import datetime
from pathlib import Path
from threading import Thread, Event, Lock
from typing import Optional
from uuid import UUID, uuid4
from queue import Queue, Full, Empty

import cv2
import numpy as np
from PIL import Image

from config import get_settings
from models.schemas import CaptureMode, FrameInfo
from utils.logger import get_logger
from utils.exceptions import RTSPConnectionError, FrameCaptureError, ResourceLimitError

logger = get_logger(__name__)


class RTSPStreamCapture:
    """
    Handles RTSP stream capture with automatic reconnection and buffering.
    """
    
    def __init__(
        self,
        rtsp_url: str,
        camera_id: str,
        capture_mode: CaptureMode = CaptureMode.SINGLE_FRAME,
        fps: Optional[float] = None,
        duration: Optional[int] = None
    ):
        """
        Initialize RTSP capture.
        
        Args:
            rtsp_url: RTSP stream URL
            camera_id: Unique camera identifier
            capture_mode: Capture mode (single_frame, continuous, event_driven)
            fps: Target frames per second for capture
            duration: Capture duration in seconds (for continuous mode)
        """
        self.settings = get_settings()
        self.rtsp_url = rtsp_url
        self.camera_id = camera_id
        self.capture_mode = capture_mode
        self.fps = fps or self.settings.rtsp.default_fps
        self.duration = duration
        
        self.capture: Optional[cv2.VideoCapture] = None
        self.is_running = Event()
        self.is_connected = Event()
        self.capture_thread: Optional[Thread] = None
        self.frame_queue: Queue = Queue(maxsize=self.settings.rtsp.frame_buffer_size)
        self.lock = Lock()
        
        self.reconnect_attempts = 0
        self.frame_count = 0
        self.last_frame_time = 0.0
        
        logger.info(
            "rtsp_capture_initialized",
            camera_id=camera_id,
            capture_mode=capture_mode.value,
            fps=self.fps
        )
    
    def connect(self) -> bool:
        """
        Connect to RTSP stream.
        
        Returns:
            True if connection successful, False otherwise
            
        Raises:
            RTSPConnectionError: If connection fails after all retry attempts
        """
        try:
            logger.info("rtsp_connecting", camera_id=self.camera_id, url=self._sanitize_url(self.rtsp_url))
            
            self.capture = cv2.VideoCapture(self.rtsp_url)
            
            # Set buffer size to minimize latency
            self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 3)
            
            # Try to read a test frame
            ret, frame = self.capture.read()
            
            if ret and frame is not None:
                self.is_connected.set()
                logger.info(
                    "rtsp_connected",
                    camera_id=self.camera_id,
                    width=int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH)),
                    height=int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                    fps=self.capture.get(cv2.CAP_PROP_FPS)
                )
                return True
            else:
                raise RTSPConnectionError(
                    f"Failed to read test frame from RTSP stream: {self.camera_id}",
                    details={"camera_id": self.camera_id}
                )
                
        except Exception as e:
            self.is_connected.clear()
            logger.error(
                "rtsp_connection_failed",
                camera_id=self.camera_id,
                error=str(e),
                attempt=self.reconnect_attempts + 1
            )
            raise RTSPConnectionError(
                f"Failed to connect to RTSP stream: {str(e)}",
                details={"camera_id": self.camera_id, "url": self._sanitize_url(self.rtsp_url)}
            )
    
    def disconnect(self) -> None:
        """Disconnect from RTSP stream and cleanup resources."""
        with self.lock:
            if self.capture is not None:
                self.capture.release()
                self.capture = None
            self.is_connected.clear()
            
        logger.info("rtsp_disconnected", camera_id=self.camera_id)
    
    def start(self) -> None:
        """Start capture thread based on capture mode."""
        if self.is_running.is_set():
            logger.warning("rtsp_already_running", camera_id=self.camera_id)
            return
        
        if not self.is_connected.is_set():
            self.connect()
        
        self.is_running.set()
        
        if self.capture_mode == CaptureMode.SINGLE_FRAME:
            # Synchronous single frame capture
            self._capture_single_frame()
        else:
            # Asynchronous continuous capture
            self.capture_thread = Thread(
                target=self._capture_loop,
                name=f"RTSPCapture-{self.camera_id}",
                daemon=True
            )
            self.capture_thread.start()
            logger.info("rtsp_capture_started", camera_id=self.camera_id, mode=self.capture_mode.value)
    
    def stop(self) -> None:
        """Stop capture thread and cleanup."""
        if not self.is_running.is_set():
            return
        
        self.is_running.clear()
        
        if self.capture_thread is not None and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=5.0)
        
        self.disconnect()
        logger.info("rtsp_capture_stopped", camera_id=self.camera_id, frames_captured=self.frame_count)
    
    def _capture_single_frame(self) -> None:
        """Capture a single frame and add to queue."""
        try:
            ret, frame = self.capture.read()
            
            if ret and frame is not None:
                timestamp = datetime.utcnow()
                self._add_frame_to_queue(frame, timestamp)
                self.frame_count += 1
                logger.info("rtsp_frame_captured", camera_id=self.camera_id, frame_number=self.frame_count)
            else:
                raise FrameCaptureError(
                    f"Failed to capture frame from camera: {self.camera_id}",
                    details={"camera_id": self.camera_id}
                )
        except Exception as e:
            logger.error("rtsp_frame_capture_error", camera_id=self.camera_id, error=str(e))
            raise
        finally:
            self.is_running.clear()
    
    def _capture_loop(self) -> None:
        """Continuous frame capture loop with FPS control."""
        start_time = time.time()
        frame_interval = 1.0 / self.fps
        
        while self.is_running.is_set():
            try:
                # Check duration limit for continuous mode
                if self.duration and (time.time() - start_time) >= self.duration:
                    logger.info(
                        "rtsp_duration_reached",
                        camera_id=self.camera_id,
                        duration=self.duration,
                        frames_captured=self.frame_count
                    )
                    break
                
                # FPS throttling
                current_time = time.time()
                elapsed = current_time - self.last_frame_time
                
                if elapsed < frame_interval:
                    time.sleep(frame_interval - elapsed)
                    continue
                
                # Capture frame
                ret, frame = self.capture.read()
                
                if ret and frame is not None:
                    timestamp = datetime.utcnow()
                    self._add_frame_to_queue(frame, timestamp)
                    self.frame_count += 1
                    self.last_frame_time = time.time()
                    
                    if self.frame_count % 10 == 0:
                        logger.debug(
                            "rtsp_frames_captured",
                            camera_id=self.camera_id,
                            count=self.frame_count
                        )
                else:
                    # Connection lost, attempt reconnection
                    logger.warning("rtsp_frame_read_failed", camera_id=self.camera_id)
                    self._handle_reconnection()
                    
            except Exception as e:
                logger.error("rtsp_capture_loop_error", camera_id=self.camera_id, error=str(e))
                self._handle_reconnection()
        
        self.is_running.clear()
    
    def _add_frame_to_queue(self, frame: np.ndarray, timestamp: datetime) -> None:
        """
        Add captured frame to queue.
        
        Args:
            frame: Captured frame as numpy array
            timestamp: Frame capture timestamp
        """
        try:
            self.frame_queue.put_nowait((frame, timestamp))
        except Full:
            # Queue is full, drop oldest frame
            try:
                self.frame_queue.get_nowait()
                self.frame_queue.put_nowait((frame, timestamp))
                logger.warning("rtsp_frame_queue_full", camera_id=self.camera_id, action="dropped_oldest")
            except Exception as e:
                logger.error("rtsp_queue_error", camera_id=self.camera_id, error=str(e))
    
    def _handle_reconnection(self) -> None:
        """Handle reconnection attempts with exponential backoff."""
        if self.reconnect_attempts >= self.settings.rtsp.reconnect_attempts:
            logger.error(
                "rtsp_reconnect_failed",
                camera_id=self.camera_id,
                attempts=self.reconnect_attempts
            )
            self.is_running.clear()
            return
        
        self.reconnect_attempts += 1
        delay = self.settings.rtsp.reconnect_delay * self.reconnect_attempts
        
        logger.info(
            "rtsp_reconnecting",
            camera_id=self.camera_id,
            attempt=self.reconnect_attempts,
            delay=delay
        )
        
        self.disconnect()
        time.sleep(delay)
        
        try:
            self.connect()
            self.reconnect_attempts = 0  # Reset on successful reconnection
        except RTSPConnectionError:
            pass  # Will retry in next iteration
    
    def get_frame(self, timeout: Optional[float] = None) -> Optional[tuple[np.ndarray, datetime]]:
        """
        Get next frame from queue.
        
        Args:
            timeout: Maximum time to wait for frame (None = non-blocking)
            
        Returns:
            Tuple of (frame, timestamp) or None if queue is empty
        """
        try:
            return self.frame_queue.get(block=timeout is not None, timeout=timeout)
        except Empty:
            return None
    
    def get_all_frames(self) -> list[tuple[np.ndarray, datetime]]:
        """
        Get all frames currently in queue.
        
        Returns:
            List of (frame, timestamp) tuples
        """
        frames = []
        while not self.frame_queue.empty():
            try:
                frames.append(self.frame_queue.get_nowait())
            except Empty:
                break
        return frames
    
    @staticmethod
    def _sanitize_url(url: str) -> str:
        """Sanitize URL by removing credentials for logging."""
        try:
            from urllib.parse import urlparse, urlunparse
            parsed = urlparse(url)
            sanitized = parsed._replace(netloc=f"***:***@{parsed.hostname}:{parsed.port}" if parsed.port else f"***:***@{parsed.hostname}")
            return urlunparse(sanitized)
        except Exception:
            return "***"
    
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop()


class RTSPCaptureManager:
    """
    Manages multiple concurrent RTSP captures with resource limiting.
    """
    
    def __init__(self):
        """Initialize capture manager."""
        self.settings = get_settings()
        self.active_captures: dict[str, RTSPStreamCapture] = {}
        self.lock = Lock()
        logger.info("rtsp_manager_initialized", max_streams=self.settings.rtsp.max_concurrent_streams)
    
    def create_capture(
        self,
        rtsp_url: str,
        camera_id: str,
        capture_mode: CaptureMode = CaptureMode.SINGLE_FRAME,
        fps: Optional[float] = None,
        duration: Optional[int] = None
    ) -> RTSPStreamCapture:
        """
        Create and register a new RTSP capture.
        
        Args:
            rtsp_url: RTSP stream URL
            camera_id: Unique camera identifier
            capture_mode: Capture mode
            fps: Target FPS
            duration: Capture duration
            
        Returns:
            RTSPStreamCapture instance
            
        Raises:
            ResourceLimitError: If max concurrent streams exceeded
        """
        with self.lock:
            if len(self.active_captures) >= self.settings.rtsp.max_concurrent_streams:
                raise ResourceLimitError(
                    f"Maximum concurrent RTSP streams ({self.settings.rtsp.max_concurrent_streams}) exceeded",
                    details={"active_captures": len(self.active_captures)}
                )
            
            capture = RTSPStreamCapture(
                rtsp_url=rtsp_url,
                camera_id=camera_id,
                capture_mode=capture_mode,
                fps=fps,
                duration=duration
            )
            
            self.active_captures[camera_id] = capture
            logger.info("rtsp_capture_created", camera_id=camera_id, active_count=len(self.active_captures))
            
            return capture
    
    def remove_capture(self, camera_id: str) -> None:
        """
        Remove and cleanup a capture.
        
        Args:
            camera_id: Camera identifier to remove
        """
        with self.lock:
            if camera_id in self.active_captures:
                capture = self.active_captures[camera_id]
                capture.stop()
                del self.active_captures[camera_id]
                logger.info("rtsp_capture_removed", camera_id=camera_id, active_count=len(self.active_captures))
    
    def get_capture(self, camera_id: str) -> Optional[RTSPStreamCapture]:
        """Get active capture by camera ID."""
        return self.active_captures.get(camera_id)
    
    def stop_all(self) -> None:
        """Stop all active captures."""
        with self.lock:
            for camera_id, capture in list(self.active_captures.items()):
                capture.stop()
            self.active_captures.clear()
            logger.info("rtsp_all_captures_stopped")
