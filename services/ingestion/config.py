"""
Configuration management for the Ingestion Service.
Uses Pydantic settings for type-safe configuration with environment variable support.
"""
from functools import lru_cache
from typing import Optional, Tuple
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):
    """Database configuration."""
    host: str = Field(default="localhost", description="PostgreSQL host")
    port: int = Field(default=5432, description="PostgreSQL port")
    name: str = Field(default="trackshift", description="Database name")
    user: str = Field(default="postgres", description="Database user")
    password: str = Field(default="", description="Database password")
    pool_size: int = Field(default=10, description="Connection pool size")
    max_overflow: int = Field(default=20, description="Max pool overflow")
    
    @property
    def url(self) -> str:
        """Generate database URL."""
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
    
    model_config = SettingsConfigDict(env_prefix="DB_")


class StorageSettings(BaseSettings):
    """Object storage (S3/MinIO) configuration."""
    endpoint: str = Field(default="localhost:9000", description="S3/MinIO endpoint")
    access_key: str = Field(default="minioadmin", description="Access key")
    secret_key: str = Field(default="minioadmin", description="Secret key")
    bucket_name: str = Field(default="trackshift-frames", description="Bucket name")
    region: str = Field(default="us-east-1", description="Region")
    secure: bool = Field(default=False, description="Use HTTPS")
    
    model_config = SettingsConfigDict(env_prefix="STORAGE_")


class RedisSettings(BaseSettings):
    """Redis configuration."""
    host: str = Field(default="localhost", description="Redis host")
    port: int = Field(default=6379, description="Redis port")
    db: int = Field(default=0, description="Redis database number")
    password: Optional[str] = Field(default=None, description="Redis password")
    max_connections: int = Field(default=50, description="Max connections")
    
    @property
    def url(self) -> str:
        """Generate Redis URL."""
        auth = f":{self.password}@" if self.password else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"
    
    model_config = SettingsConfigDict(env_prefix="REDIS_")


class RTSPSettings(BaseSettings):
    """RTSP capture configuration."""
    max_concurrent_streams: int = Field(default=10, description="Max concurrent RTSP streams")
    frame_buffer_size: int = Field(default=100, description="Frame buffer size")
    capture_timeout: int = Field(default=30, description="Capture timeout in seconds")
    reconnect_attempts: int = Field(default=3, description="Reconnection attempts")
    reconnect_delay: int = Field(default=5, description="Delay between reconnects (seconds)")
    default_fps: float = Field(default=1.0, description="Default capture FPS")
    
    model_config = SettingsConfigDict(env_prefix="RTSP_")


class UploadSettings(BaseSettings):
    """File upload configuration."""
    max_file_size: int = Field(default=50 * 1024 * 1024, description="Max file size in bytes (50MB)")
    max_batch_size: int = Field(default=10, description="Max files per batch upload")
    allowed_extensions: list[str] = Field(
        default=["jpg", "jpeg", "png", "bmp", "tiff"],
        description="Allowed image extensions"
    )
    temp_upload_dir: str = Field(default="/tmp/trackshift/uploads", description="Temporary upload directory")
    
    model_config = SettingsConfigDict(env_prefix="UPLOAD_")


class APISettings(BaseSettings):
    """API configuration."""
    title: str = Field(default="TrackShift Ingestion Service", description="API title")
    version: str = Field(default="1.0.0", description="API version")
    description: str = Field(default="Ingestion service for visual change detection", description="API description")
    host: str = Field(default="0.0.0.0", description="API host")
    port: int = Field(default=8000, description="API port")
    workers: int = Field(default=4, description="Number of worker processes")
    
    # Security
    secret_key: str = Field(default="change-me-in-production", description="JWT secret key")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Token expiry in minutes")
    
    # CORS
    cors_origins: list[str] = Field(default=["*"], description="Allowed CORS origins")
    cors_credentials: bool = Field(default=True, description="Allow credentials")
    cors_methods: list[str] = Field(default=["*"], description="Allowed methods")
    cors_headers: list[str] = Field(default=["*"], description="Allowed headers")
    
    model_config = SettingsConfigDict(env_prefix="API_")


class LoggingSettings(BaseSettings):
    """Logging configuration."""
    level: str = Field(default="INFO", description="Log level")
    format: str = Field(default="json", description="Log format: json or console")
    output_dir: str = Field(default="logs", description="Log output directory")
    
    @field_validator("level")
    @classmethod
    def validate_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of {valid_levels}")
        return v_upper
    
    model_config = SettingsConfigDict(env_prefix="LOG_")


class SegmentationSettings(BaseSettings):
    """Segmentation pipeline configuration (Steps 1-5)."""
    sam_checkpoint_path: str = Field(
        default="models/sam_vit_h_4b8939.pth",
        description="Path to SAM ViT checkpoint"
    )
    sam_model_type: str = Field(default="vit_h", description="SAM backbone identifier")
    device: str = Field(default="cuda", description="Preferred torch device (cuda|cpu)")
    output_dir: str = Field(default="outputs/segmentation", description="Base artifact directory")
    default_bbox_ratio: Tuple[float, float, float, float] = Field(
        default=(0.05, 0.15, 0.9, 0.7),
        description="Normalized (x, y, width, height) fallback bounding box"
    )
    clahe_clip_limit: float = Field(default=2.0, description="CLAHE clip limit")
    clahe_tile_grid_size: int = Field(default=8, description="CLAHE grid size")
    
    # Step 5: Change Detection
    enable_change_detection: bool = Field(default=False, description="Enable AnyChange detection (Step 5)")
    change_confidence_threshold: int = Field(default=145, description="AnyChange confidence threshold (lower = more sensitive)")
    change_use_normalized_feature: bool = Field(default=True, description="Use normalized features for lighting robustness")
    change_bitemporal_match: bool = Field(default=True, description="Match masks bidirectionally")
    change_area_thresh: float = Field(default=0.8, description="Filter masks > this ratio of image area")
    change_points_per_side: int = Field(default=32, description="SAM grid density (32x32 = 1024 points)")
    change_stability_score_thresh: float = Field(default=0.95, description="SAM stability threshold")
    change_pred_iou_thresh: float = Field(default=0.88, description="SAM IoU quality threshold")
    change_box_nms_thresh: float = Field(default=0.7, description="Remove overlapping masks")

    model_config = SettingsConfigDict(env_prefix="SEGMENTATION_")


class Settings(BaseSettings):
    """Main application settings."""
    environment: str = Field(default="development", description="Environment: development, staging, production")
    debug: bool = Field(default=False, description="Debug mode")
    
    # Sub-configurations - using model_validate to handle env vars properly
    db: DatabaseSettings = Field(default_factory=DatabaseSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    rtsp: RTSPSettings = Field(default_factory=RTSPSettings)
    upload: UploadSettings = Field(default_factory=UploadSettings)
    api: APISettings = Field(default_factory=APISettings)
    log: LoggingSettings = Field(default_factory=LoggingSettings)
    segmentation: SegmentationSettings = Field(default_factory=SegmentationSettings)
    
    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment."""
        valid_envs = ["development", "staging", "production"]
        if v.lower() not in valid_envs:
            raise ValueError(f"Invalid environment. Must be one of {valid_envs}")
        return v.lower()
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",
        extra="allow"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    This ensures we only load settings once and reuse the same instance.
    """
    return Settings()
