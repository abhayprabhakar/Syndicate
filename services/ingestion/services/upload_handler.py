"""
File upload handler service for manual image ingestion.
Handles validation, processing, and temporary storage of uploaded images.
"""
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import BinaryIO, Optional
from uuid import uuid4

from PIL import Image
import magic

from config import get_settings
from utils.logger import get_logger
from utils.exceptions import ValidationError, FileProcessingError

logger = get_logger(__name__)


class FileUploadHandler:
    """
    Handles file upload validation and processing.
    """
    
    def __init__(self):
        """Initialize file upload handler."""
        self.settings = get_settings()
        self.temp_dir = Path(self.settings.upload.temp_upload_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        logger.info("upload_handler_initialized", temp_dir=str(self.temp_dir))
    
    def validate_file(self, filename: str, file_size: int) -> None:
        """
        Validate uploaded file.
        
        Args:
            filename: Original filename
            file_size: File size in bytes
            
        Raises:
            ValidationError: If validation fails
        """
        # Check file size
        if file_size > self.settings.upload.max_file_size:
            raise ValidationError(
                f"File size ({file_size} bytes) exceeds maximum allowed size ({self.settings.upload.max_file_size} bytes)",
                details={
                    "filename": filename,
                    "size": file_size,
                    "max_size": self.settings.upload.max_file_size
                }
            )
        
        # Check file extension
        file_ext = Path(filename).suffix.lower().lstrip('.')
        if file_ext not in self.settings.upload.allowed_extensions:
            raise ValidationError(
                f"File extension '.{file_ext}' is not allowed",
                details={
                    "filename": filename,
                    "extension": file_ext,
                    "allowed": self.settings.upload.allowed_extensions
                }
            )
        
        logger.debug("file_validated", filename=filename, size=file_size, extension=file_ext)
    
    def validate_mime_type(self, file_path: Path) -> str:
        """
        Validate file MIME type using magic bytes.
        
        Args:
            file_path: Path to file
            
        Returns:
            MIME type string
            
        Raises:
            ValidationError: If MIME type is not an image
        """
        try:
            mime = magic.Magic(mime=True)
            mime_type = mime.from_file(str(file_path))
            
            if not mime_type.startswith('image/'):
                raise ValidationError(
                    f"File is not a valid image (MIME type: {mime_type})",
                    details={"file_path": str(file_path), "mime_type": mime_type}
                )
            
            logger.debug("mime_type_validated", file_path=str(file_path), mime_type=mime_type)
            return mime_type
            
        except Exception as e:
            raise ValidationError(
                f"Failed to validate file MIME type: {str(e)}",
                details={"file_path": str(file_path)}
            )
    
    async def save_upload(
        self,
        file: BinaryIO,
        filename: str,
        camera_id: str
    ) -> tuple[Path, dict]:
        """
        Save uploaded file to temporary storage and extract metadata.
        
        Args:
            file: File-like object
            filename: Original filename
            camera_id: Camera identifier
            
        Returns:
            Tuple of (file_path, metadata_dict)
            
        Raises:
            FileProcessingError: If file processing fails
        """
        try:
            # Generate unique filename
            file_ext = Path(filename).suffix.lower()
            unique_filename = f"{uuid4()}{file_ext}"
            
            # Create camera-specific subdirectory
            camera_dir = self.temp_dir / camera_id
            camera_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = camera_dir / unique_filename
            
            # Save file
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file, f)
            
            logger.info(
                "file_saved",
                original_filename=filename,
                saved_path=str(file_path),
                camera_id=camera_id
            )
            
            # Validate MIME type
            mime_type = self.validate_mime_type(file_path)
            
            # Extract image metadata
            metadata = self._extract_image_metadata(file_path, mime_type)
            metadata['original_filename'] = filename
            metadata['upload_timestamp'] = datetime.utcnow().isoformat()
            
            return file_path, metadata
            
        except Exception as e:
            logger.error("file_save_error", filename=filename, error=str(e))
            raise FileProcessingError(
                f"Failed to save uploaded file: {str(e)}",
                details={"filename": filename, "camera_id": camera_id}
            )
    
    def _extract_image_metadata(self, file_path: Path, mime_type: str) -> dict:
        """
        Extract metadata from image file.
        
        Args:
            file_path: Path to image file
            mime_type: MIME type of file
            
        Returns:
            Dictionary containing image metadata
        """
        try:
            with Image.open(file_path) as img:
                metadata = {
                    'width': img.width,
                    'height': img.height,
                    'format': img.format,
                    'mode': img.mode,
                    'mime_type': mime_type,
                    'size_bytes': file_path.stat().st_size
                }
                
                # Extract EXIF data if available
                exif_data = {}
                if hasattr(img, '_getexif') and img._getexif() is not None:
                    from PIL.ExifTags import TAGS
                    exif = img._getexif()
                    for tag_id, value in exif.items():
                        tag_name = TAGS.get(tag_id, tag_id)
                        exif_data[tag_name] = str(value)
                
                if exif_data:
                    metadata['exif'] = exif_data
                
                logger.debug(
                    "image_metadata_extracted",
                    file_path=str(file_path),
                    width=metadata['width'],
                    height=metadata['height']
                )
                
                return metadata
                
        except Exception as e:
            logger.warning("metadata_extraction_failed", file_path=str(file_path), error=str(e))
            return {
                'mime_type': mime_type,
                'size_bytes': file_path.stat().st_size
            }
    
    def validate_image_file(self, file_path: Path) -> bool:
        """
        Validate that file is a valid, openable image.
        
        Args:
            file_path: Path to image file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            with Image.open(file_path) as img:
                img.verify()
            
            # Re-open after verify (verify closes the file)
            with Image.open(file_path) as img:
                img.load()
            
            logger.debug("image_validated", file_path=str(file_path))
            return True
            
        except Exception as e:
            logger.error("image_validation_failed", file_path=str(file_path), error=str(e))
            return False
    
    def cleanup_temp_file(self, file_path: Path) -> None:
        """
        Remove temporary file.
        
        Args:
            file_path: Path to file to remove
        """
        try:
            if file_path.exists():
                file_path.unlink()
                logger.debug("temp_file_cleaned", file_path=str(file_path))
        except Exception as e:
            logger.warning("temp_file_cleanup_failed", file_path=str(file_path), error=str(e))
    
    def cleanup_camera_temp_dir(self, camera_id: str, older_than_hours: int = 24) -> int:
        """
        Cleanup old temporary files for a camera.
        
        Args:
            camera_id: Camera identifier
            older_than_hours: Remove files older than this many hours
            
        Returns:
            Number of files removed
        """
        camera_dir = self.temp_dir / camera_id
        if not camera_dir.exists():
            return 0
        
        removed_count = 0
        cutoff_time = datetime.now().timestamp() - (older_than_hours * 3600)
        
        try:
            for file_path in camera_dir.glob('*'):
                if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                    file_path.unlink()
                    removed_count += 1
            
            logger.info(
                "temp_dir_cleaned",
                camera_id=camera_id,
                files_removed=removed_count,
                older_than_hours=older_than_hours
            )
            
        except Exception as e:
            logger.error("temp_dir_cleanup_error", camera_id=camera_id, error=str(e))
        
        return removed_count


class BatchUploadHandler:
    """
    Handles batch upload of multiple images.
    """
    
    def __init__(self):
        """Initialize batch upload handler."""
        self.settings = get_settings()
        self.file_handler = FileUploadHandler()
        logger.info("batch_upload_handler_initialized")
    
    def validate_batch(self, file_count: int) -> None:
        """
        Validate batch upload constraints.
        
        Args:
            file_count: Number of files in batch
            
        Raises:
            ValidationError: If batch validation fails
        """
        if file_count > self.settings.upload.max_batch_size:
            raise ValidationError(
                f"Batch size ({file_count}) exceeds maximum allowed ({self.settings.upload.max_batch_size})",
                details={
                    "file_count": file_count,
                    "max_batch_size": self.settings.upload.max_batch_size
                }
            )
        
        if file_count == 0:
            raise ValidationError(
                "Batch must contain at least one file",
                details={"file_count": 0}
            )
        
        logger.debug("batch_validated", file_count=file_count)
    
    async def process_batch(
        self,
        files: list[tuple[BinaryIO, str]],
        camera_id: str
    ) -> list[tuple[Path, dict]]:
        """
        Process batch of uploaded files.
        
        Args:
            files: List of (file, filename) tuples
            camera_id: Camera identifier
            
        Returns:
            List of (file_path, metadata) tuples for successfully processed files
            
        Raises:
            ValidationError: If batch validation fails
        """
        self.validate_batch(len(files))
        
        processed_files = []
        failed_files = []
        
        for file, filename in files:
            try:
                file_path, metadata = await self.file_handler.save_upload(file, filename, camera_id)
                processed_files.append((file_path, metadata))
            except Exception as e:
                logger.error("batch_file_processing_failed", filename=filename, error=str(e))
                failed_files.append((filename, str(e)))
        
        logger.info(
            "batch_processed",
            camera_id=camera_id,
            total_files=len(files),
            successful=len(processed_files),
            failed=len(failed_files)
        )
        
        if failed_files:
            logger.warning("batch_had_failures", failed_files=failed_files)
        
        return processed_files
