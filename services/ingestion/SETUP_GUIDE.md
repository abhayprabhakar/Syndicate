# TrackShift Ingestion Service - Setup & Usage Guide

## Quick Start

### Prerequisites
- Python 3.11+
- Docker & Docker Compose (for infrastructure)
- PostgreSQL 15+
- MinIO or S3-compatible storage
- Redis 7+

### Installation Steps

#### 1. Clone and Navigate
```bash
cd services/ingestion
```

#### 2. Create Virtual Environment
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# Important: Change secret keys and passwords in production!
```

#### 5. Start Infrastructure (Docker)
```bash
# Start PostgreSQL, MinIO, and Redis
docker-compose up -d postgres minio redis

# Wait for services to be healthy (check with)
docker-compose ps
```

#### 6. Initialize Database
```bash
# Database tables are created automatically on first startup
# Or run manually:
python -c "
import asyncio
from repositories.database import DatabaseManager

async def init():
    db = DatabaseManager()
    await db.create_tables()
    await db.close()

asyncio.run(init())
"
```

#### 7. Run the Service
```bash
# Development mode (with auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Using Docker Compose (Recommended)

Start the entire stack:
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- MinIO (port 9000, console: 9001)
- Redis (port 6379)
- Ingestion Service (port 8000)

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Metrics**: http://localhost:8000/metrics

## API Usage Examples

### 1. Upload Images

```bash
curl -X POST "http://localhost:8000/api/v1/ingest/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "camera_id=Haas_Pit_1" \
  -F "files=@before.jpg" \
  -F "files=@after.jpg" \
  -F 'meta={"session":"FP1","location":"Pit Lane"}'
```

### 2. Capture from RTSP Stream

```bash
curl -X POST "http://localhost:8000/api/v1/ingest/rtsp" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "rtsp",
    "rtsp_url": "rtsp://user:pass@camera:554/stream",
    "camera_id": "Haas_Pit_1",
    "capture_mode": "single_frame",
    "meta": {
      "session": "FP1",
      "location": "Pit Lane"
    }
  }'
```

### 3. Check Request Status

```bash
curl -X GET "http://localhost:8000/api/v1/ingest/status/{request_id}"
```

## Testing

### Run All Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=. --cov-report=html
```

### Run Specific Test File
```bash
pytest tests/test_config.py -v
```

## Configuration Reference

### Environment Variables

#### Database
- `DB__HOST` - PostgreSQL host (default: localhost)
- `DB__PORT` - PostgreSQL port (default: 5432)
- `DB__NAME` - Database name (default: trackshift)
- `DB__USER` - Database user (default: postgres)
- `DB__PASSWORD` - Database password

#### Storage (MinIO/S3)
- `STORAGE__ENDPOINT` - S3 endpoint (default: localhost:9000)
- `STORAGE__ACCESS_KEY` - Access key (default: minioadmin)
- `STORAGE__SECRET_KEY` - Secret key (default: minioadmin)
- `STORAGE__BUCKET_NAME` - Bucket name (default: trackshift-frames)
- `STORAGE__SECURE` - Use HTTPS (default: False)

#### RTSP
- `RTSP__MAX_CONCURRENT_STREAMS` - Max concurrent streams (default: 10)
- `RTSP__CAPTURE_TIMEOUT` - Capture timeout in seconds (default: 30)
- `RTSP__DEFAULT_FPS` - Default capture FPS (default: 1.0)

#### Upload
- `UPLOAD__MAX_FILE_SIZE` - Max file size in bytes (default: 50MB)
- `UPLOAD__MAX_BATCH_SIZE` - Max files per batch (default: 10)

## Project Structure

```
ingestion/
├── api/                    # REST API endpoints
│   ├── __init__.py
│   └── endpoints.py       # FastAPI routes
├── models/                # Data models
│   ├── __init__.py
│   ├── schemas.py        # Pydantic models (request/response)
│   └── entities.py       # SQLAlchemy models (database)
├── repositories/          # Data access layer
│   ├── __init__.py
│   └── database.py       # Database operations
├── services/             # Business logic
│   ├── __init__.py
│   ├── orchestrator.py   # Main workflow coordinator
│   ├── rtsp_capture.py   # RTSP stream handling
│   ├── upload_handler.py # File upload processing
│   └── storage_service.py # S3/MinIO operations
├── utils/                # Utilities
│   ├── __init__.py
│   ├── logger.py         # Structured logging
│   └── exceptions.py     # Custom exceptions
├── tests/                # Unit tests
│   ├── __init__.py
│   ├── conftest.py       # Pytest fixtures
│   ├── test_config.py
│   └── test_schemas.py
├── config.py             # Configuration management
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container image
├── docker-compose.yml    # Multi-container setup
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
└── README.md            # Documentation
```

## Architecture Highlights

### Separation of Concerns
- **API Layer**: HTTP endpoints, request validation
- **Service Layer**: Business logic, orchestration
- **Repository Layer**: Database operations, data access
- **Models**: Data contracts, validation schemas

### Design Patterns
- **Repository Pattern**: Abstraction over data access
- **Dependency Injection**: Services injected via FastAPI dependencies
- **Factory Pattern**: Database session management
- **Strategy Pattern**: Different capture modes (RTSP, upload)

### Key Features
- ✅ Type-safe configuration with Pydantic
- ✅ Structured JSON logging with context
- ✅ Async database operations (SQLAlchemy + asyncpg)
- ✅ Object storage integration (MinIO/S3)
- ✅ RTSP stream capture with reconnection
- ✅ Comprehensive error handling
- ✅ Prometheus metrics
- ✅ Health checks
- ✅ Docker containerization
- ✅ Unit tests with pytest

## Monitoring & Observability

### Logs
- Structured JSON logs in `logs/` directory
- Configurable log levels via `LOG__LEVEL`
- Request/response logging with correlation IDs

### Metrics (Prometheus)
Access metrics at http://localhost:8000/metrics

Key metrics:
- `ingestion_requests_total` - Total requests by endpoint
- `ingestion_request_duration_seconds` - Request latency
- `ingestion_frames_total` - Total frames ingested

### Health Checks
- Main health endpoint: `/health`
- Docker health check configured
- Checks database, storage, and Redis connectivity

## Production Deployment

### Security Checklist
- [ ] Change all default passwords
- [ ] Generate strong `API__SECRET_KEY`
- [ ] Enable HTTPS for MinIO (`STORAGE__SECURE=True`)
- [ ] Restrict CORS origins (`API__CORS_ORIGINS`)
- [ ] Use environment-specific configuration
- [ ] Enable network encryption (SSL/TLS)
- [ ] Implement rate limiting
- [ ] Set up proper logging and monitoring
- [ ] Configure backup for PostgreSQL and MinIO

### Scaling Considerations
- Use multiple worker processes (gunicorn `-w` flag)
- Deploy behind a load balancer (nginx, traefik)
- Use managed PostgreSQL (RDS, Cloud SQL)
- Use managed object storage (S3, GCS, Azure Blob)
- Use Redis cluster for high availability
- Implement caching layers
- Add queue system for async processing (Celery)

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Test connection
psql -h localhost -U postgres -d trackshift
```

### Storage Issues
```bash
# Access MinIO console
# Open http://localhost:9001 in browser
# Login: minioadmin / minioadmin

# Check bucket exists
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/trackshift-frames
```

### RTSP Connection Issues
- Verify RTSP URL format: `rtsp://username:password@host:port/path`
- Check network connectivity to camera
- Test RTSP stream with VLC or ffplay
- Check firewall rules
- Verify camera supports RTSP protocol

## Development

### Adding New Features
1. Create model in `models/schemas.py` (request/response)
2. Add database entity in `models/entities.py` if needed
3. Implement service logic in `services/`
4. Create repository methods in `repositories/`
5. Add API endpoint in `api/endpoints.py`
6. Write unit tests in `tests/`
7. Update documentation

### Code Style
- Follow PEP 8
- Use type hints
- Add docstrings to public methods
- Use meaningful variable names
- Keep functions focused and small

## Support & Contributing

For issues, feature requests, or contributions, please refer to the main project repository.

## License

See the main project LICENSE file.
