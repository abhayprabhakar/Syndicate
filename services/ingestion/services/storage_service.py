"""
Storage service for S3/MinIO integration.
Handles frame storage, retrieval, and management in object storage.
"""
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, BinaryIO
from uuid import UUID

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError, BotoCoreError
from minio import Minio
from minio.error import S3Error

from config import get_settings
from utils.logger import get_logger
from utils.exceptions import StorageError

logger = get_logger(__name__)


class StorageService:
    """
    Handles object storage operations for frame images using S3/MinIO.
    """
    
    def __init__(self):
        """Initialize storage service with S3/MinIO client."""
        self.settings = get_settings().storage
        self.bucket_name = self.settings.bucket_name
        
        # Initialize MinIO client
        self.client = Minio(
            self.settings.endpoint,
            access_key=self.settings.access_key,
            secret_key=self.settings.secret_key,
            secure=self.settings.secure,
            region=self.settings.region
        )
        
        # Initialize boto3 client for advanced operations
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f"{'https' if self.settings.secure else 'http'}://{self.settings.endpoint}",
            aws_access_key_id=self.settings.access_key,
            aws_secret_access_key=self.settings.secret_key,
            config=Config(signature_version='s3v4'),
            region_name=self.settings.region
        )
        
        self._ensure_bucket_exists()
        logger.info("storage_service_initialized", bucket=self.bucket_name, endpoint=self.settings.endpoint)
    
    def _ensure_bucket_exists(self) -> None:
        """Ensure the storage bucket exists, create if not."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info("storage_bucket_created", bucket=self.bucket_name)
            else:
                logger.info("storage_bucket_exists", bucket=self.bucket_name)
        except S3Error as e:
            logger.error("storage_bucket_error", bucket=self.bucket_name, error=str(e))
            raise StorageError(
                f"Failed to ensure bucket exists: {str(e)}",
                details={"bucket": self.bucket_name}
            )
    
    def generate_storage_path(
        self,
        camera_id: str,
        frame_id: UUID,
        timestamp: datetime,
        extension: str = "jpg"
    ) -> str:
        """
        Generate structured storage path for frame.
        
        Format: frames/YYYY/MM/DD/camera_id/frame_id.ext
        
        Args:
            camera_id: Camera identifier
            frame_id: Frame UUID
            timestamp: Frame timestamp
            extension: File extension (without dot)
            
        Returns:
            Storage path string
        """
        date_path = timestamp.strftime("%Y/%m/%d")
        path = f"frames/{date_path}/{camera_id}/{frame_id}.{extension}"
        return path
    
    def upload_frame(
        self,
        file_path: Path,
        storage_path: str,
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload frame to storage.
        
        Args:
            file_path: Local file path
            storage_path: Destination path in storage
            metadata: Optional metadata to attach
            
        Returns:
            Storage path of uploaded file
            
        Raises:
            StorageError: If upload fails
        """
        try:
            # Prepare metadata
            meta_dict = metadata or {}
            meta_dict['uploaded_at'] = datetime.utcnow().isoformat()
            
            # Upload file
            self.client.fput_object(
                bucket_name=self.bucket_name,
                object_name=storage_path,
                file_path=str(file_path),
                metadata=meta_dict
            )
            
            logger.info(
                "frame_uploaded",
                storage_path=storage_path,
                local_path=str(file_path),
                size_bytes=file_path.stat().st_size
            )
            
            return storage_path
            
        except S3Error as e:
            logger.error("frame_upload_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to upload frame: {str(e)}",
                details={"storage_path": storage_path, "local_path": str(file_path)}
            )
    
    def upload_frame_from_bytes(
        self,
        data: bytes,
        storage_path: str,
        content_type: str = "image/jpeg",
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload frame from bytes data.
        
        Args:
            data: Binary frame data
            storage_path: Destination path in storage
            content_type: Content type (MIME type)
            metadata: Optional metadata to attach
            
        Returns:
            Storage path of uploaded file
            
        Raises:
            StorageError: If upload fails
        """
        try:
            from io import BytesIO
            
            # Prepare metadata
            meta_dict = metadata or {}
            meta_dict['uploaded_at'] = datetime.utcnow().isoformat()
            
            # Upload from bytes
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=storage_path,
                data=BytesIO(data),
                length=len(data),
                content_type=content_type,
                metadata=meta_dict
            )
            
            logger.info(
                "frame_uploaded_from_bytes",
                storage_path=storage_path,
                size_bytes=len(data)
            )
            
            return storage_path
            
        except S3Error as e:
            logger.error("frame_upload_from_bytes_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to upload frame from bytes: {str(e)}",
                details={"storage_path": storage_path, "size_bytes": len(data)}
            )
    
    def download_frame(self, storage_path: str, local_path: Path) -> Path:
        """
        Download frame from storage to local path.
        
        Args:
            storage_path: Source path in storage
            local_path: Destination local path
            
        Returns:
            Local file path
            
        Raises:
            StorageError: If download fails
        """
        try:
            # Ensure parent directory exists
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            self.client.fget_object(
                bucket_name=self.bucket_name,
                object_name=storage_path,
                file_path=str(local_path)
            )
            
            logger.info(
                "frame_downloaded",
                storage_path=storage_path,
                local_path=str(local_path)
            )
            
            return local_path
            
        except S3Error as e:
            logger.error("frame_download_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to download frame: {str(e)}",
                details={"storage_path": storage_path, "local_path": str(local_path)}
            )
    
    def get_frame_bytes(self, storage_path: str) -> bytes:
        """
        Get frame data as bytes.
        
        Args:
            storage_path: Path in storage
            
        Returns:
            Frame data as bytes
            
        Raises:
            StorageError: If retrieval fails
        """
        try:
            response = self.client.get_object(
                bucket_name=self.bucket_name,
                object_name=storage_path
            )
            
            data = response.read()
            response.close()
            response.release_conn()
            
            logger.debug("frame_bytes_retrieved", storage_path=storage_path, size_bytes=len(data))
            
            return data
            
        except S3Error as e:
            logger.error("frame_bytes_retrieval_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to retrieve frame bytes: {str(e)}",
                details={"storage_path": storage_path}
            )
    
    def delete_frame(self, storage_path: str) -> None:
        """
        Delete frame from storage.
        
        Args:
            storage_path: Path in storage
            
        Raises:
            StorageError: If deletion fails
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=storage_path
            )
            
            logger.info("frame_deleted", storage_path=storage_path)
            
        except S3Error as e:
            logger.error("frame_deletion_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to delete frame: {str(e)}",
                details={"storage_path": storage_path}
            )
    
    def generate_presigned_url(
        self,
        storage_path: str,
        expiry: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Generate presigned URL for temporary frame access.
        
        Args:
            storage_path: Path in storage
            expiry: URL expiration time
            
        Returns:
            Presigned URL string
            
        Raises:
            StorageError: If URL generation fails
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=storage_path,
                expires=expiry
            )
            
            logger.debug("presigned_url_generated", storage_path=storage_path, expiry_seconds=expiry.total_seconds())
            
            return url
            
        except S3Error as e:
            logger.error("presigned_url_generation_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to generate presigned URL: {str(e)}",
                details={"storage_path": storage_path}
            )
    
    def frame_exists(self, storage_path: str) -> bool:
        """
        Check if frame exists in storage.
        
        Args:
            storage_path: Path in storage
            
        Returns:
            True if frame exists, False otherwise
        """
        try:
            self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=storage_path
            )
            return True
        except S3Error:
            return False
    
    def get_frame_metadata(self, storage_path: str) -> dict:
        """
        Get frame metadata from storage.
        
        Args:
            storage_path: Path in storage
            
        Returns:
            Metadata dictionary
            
        Raises:
            StorageError: If retrieval fails
        """
        try:
            stat = self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=storage_path
            )
            
            metadata = {
                'size_bytes': stat.size,
                'last_modified': stat.last_modified.isoformat() if stat.last_modified else None,
                'etag': stat.etag,
                'content_type': stat.content_type,
                'metadata': stat.metadata
            }
            
            logger.debug("frame_metadata_retrieved", storage_path=storage_path)
            
            return metadata
            
        except S3Error as e:
            logger.error("frame_metadata_retrieval_failed", storage_path=storage_path, error=str(e))
            raise StorageError(
                f"Failed to retrieve frame metadata: {str(e)}",
                details={"storage_path": storage_path}
            )
    
    def list_frames(
        self,
        prefix: str = "frames/",
        limit: Optional[int] = None
    ) -> list[str]:
        """
        List frames in storage with optional prefix filter.
        
        Args:
            prefix: Path prefix to filter by
            limit: Maximum number of results
            
        Returns:
            List of storage paths
        """
        try:
            objects = self.client.list_objects(
                bucket_name=self.bucket_name,
                prefix=prefix,
                recursive=True
            )
            
            paths = []
            for obj in objects:
                paths.append(obj.object_name)
                if limit and len(paths) >= limit:
                    break
            
            logger.debug("frames_listed", prefix=prefix, count=len(paths))
            
            return paths
            
        except S3Error as e:
            logger.error("frame_listing_failed", prefix=prefix, error=str(e))
            raise StorageError(
                f"Failed to list frames: {str(e)}",
                details={"prefix": prefix}
            )
    
    def cleanup_old_frames(
        self,
        camera_id: str,
        older_than_days: int = 30
    ) -> int:
        """
        Delete frames older than specified days for a camera.
        
        Args:
            camera_id: Camera identifier
            older_than_days: Delete frames older than this many days
            
        Returns:
            Number of frames deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
        prefix = f"frames/"
        
        deleted_count = 0
        
        try:
            objects = self.client.list_objects(
                bucket_name=self.bucket_name,
                prefix=prefix,
                recursive=True
            )
            
            for obj in objects:
                # Check if path contains camera_id and is old enough
                if camera_id in obj.object_name and obj.last_modified < cutoff_date:
                    self.client.remove_object(
                        bucket_name=self.bucket_name,
                        object_name=obj.object_name
                    )
                    deleted_count += 1
            
            logger.info(
                "old_frames_cleaned",
                camera_id=camera_id,
                older_than_days=older_than_days,
                deleted_count=deleted_count
            )
            
        except S3Error as e:
            logger.error("old_frames_cleanup_failed", camera_id=camera_id, error=str(e))
        
        return deleted_count
