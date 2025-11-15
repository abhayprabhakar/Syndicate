"""
Custom exceptions for the ingestion service.
"""
from typing import Any, Optional


class IngestionException(Exception):
    """Base exception for all ingestion-related errors."""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}


class ConfigurationError(IngestionException):
    """Raised when there's a configuration issue."""
    pass


class ValidationError(IngestionException):
    """Raised when input validation fails."""
    pass


class StorageError(IngestionException):
    """Raised when storage operations fail."""
    pass


class DatabaseError(IngestionException):
    """Raised when database operations fail."""
    pass


class RTSPConnectionError(IngestionException):
    """Raised when RTSP connection fails."""
    pass


class FrameCaptureError(IngestionException):
    """Raised when frame capture fails."""
    pass


class FileProcessingError(IngestionException):
    """Raised when file processing fails."""
    pass


class ResourceLimitError(IngestionException):
    """Raised when resource limits are exceeded."""
    pass


class AuthenticationError(IngestionException):
    """Raised when authentication fails."""
    pass


class AuthorizationError(IngestionException):
    """Raised when authorization fails."""
    pass
