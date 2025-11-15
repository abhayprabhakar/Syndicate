"""
Unit tests for configuration management.
"""
import pytest
from pydantic import ValidationError

from config import Settings, get_settings


def test_settings_default_values():
    """Test default configuration values."""
    settings = Settings()
    
    assert settings.environment == "development"
    assert settings.debug is False
    assert settings.api.port == 8000
    assert settings.db.port == 5432
    assert settings.storage.bucket_name == "trackshift-frames"


def test_settings_validation():
    """Test configuration validation."""
    # Test invalid environment
    with pytest.raises(ValidationError):
        Settings(environment="invalid_env")
    
    # Test invalid log level
    with pytest.raises(ValidationError):
        Settings(log__level="INVALID")


def test_database_url_generation():
    """Test database URL generation."""
    settings = Settings(
        db__host="testhost",
        db__port=5433,
        db__name="testdb",
        db__user="testuser",
        db__password="testpass"
    )
    
    expected_url = "postgresql+asyncpg://testuser:testpass@testhost:5433/testdb"
    assert settings.db.url == expected_url


def test_redis_url_generation():
    """Test Redis URL generation."""
    settings = Settings(
        redis__host="testhost",
        redis__port=6380,
        redis__db=1,
        redis__password="testpass"
    )
    
    expected_url = "redis://:testpass@testhost:6380/1"
    assert settings.redis.url == expected_url


def test_get_settings_caching():
    """Test that get_settings returns cached instance."""
    settings1 = get_settings()
    settings2 = get_settings()
    
    assert settings1 is settings2
