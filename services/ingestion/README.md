# Ingestion Service

## Overview
The Ingestion Service is responsible for capturing and storing visual data from multiple sources (RTSP streams and manual uploads) for the TrackShift Visual Difference Engine.

## Features
- **RTSP Stream Capture**: Real-time frame extraction from camera feeds
- **Manual Upload**: Support for single/multiple image uploads
- **Metadata Management**: Automatic metadata extraction and persistence
- **Object Storage Integration**: S3/MinIO for scalable image storage
- **Database Integration**: PostgreSQL for metadata persistence
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Monitoring**: Built-in metrics and health checks

## Architecture
```
ingestion/
├── api/              # REST API endpoints
├── core/             # Core business logic
├── models/           # Data models and schemas
├── repositories/     # Database and storage interfaces
├── services/         # Business logic services
├── utils/            # Utility functions
├── config.py         # Configuration management
└── main.py           # Application entry point
```

## Installation
```bash
cd services/ingestion
pip install -r requirements.txt
```

## Configuration
See `config/config.yaml` for configuration options.

## Running
```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
