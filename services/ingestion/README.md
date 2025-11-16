# TrackShift Visual Intelligence Engine - Production Service

## Overview
The TrackShift Visual Intelligence Engine is a production-ready service for automated F1 vehicle inspection using advanced computer vision. It detects and classifies structural changes, generates comprehensive PDF reports with AI-powered analysis, and provides detailed visualizations.

## Features
- **🔍 Change Detection**: LoFTR feature matching + SAM segmentation
- **🤖 AI Analysis**: Google Gemini-powered detailed insights
- **📊 Data Visualization**: 6 professional F1-themed analytical graphs
- **📄 PDF Reports**: Comprehensive technical reports with recommendations
- **🎯 Component Classification**: ResNet-based F1 part identification
- **⚡ High Performance**: Optimized for production workloads
- **🔒 Production-Ready**: Error handling, logging, monitoring

## Architecture
```
ingestion/
├── api/              # FastAPI REST endpoints
├── services/         # Core business logic (detection, PDF, AI)
├── models/           # Data models and schemas
├── repositories/     # Storage and database interfaces
├── utils/            # Logging, exceptions, helpers
├── artifacts/        # Model checkpoints and assets
└── main.py           # Application entry point
```

## Quick Start

### Prerequisites
- Python 3.8+
- CUDA-capable GPU (recommended)
- 8GB+ RAM

### Installation
```bash
cd services/ingestion
pip install -r requirements.txt
```

### Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure required variables
GEMINI_API_KEY=your_api_key_here  # Optional: For AI analysis
DATABASE_URL=postgresql://...     # Your database
STORAGE_ENDPOINT=...              # S3/MinIO endpoint
```

### Running

**Development:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Production:**
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Docker:**
```bash
docker-compose up -d
```

## API Documentation

**Interactive Docs:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`

### Key Endpoints

**Pipeline (Full Analysis):**
```bash
POST /pipeline
Content-Type: multipart/form-data
- baseline: <file>
- current: <file>
```

**Check Results:**
```bash
GET /results/{job_id}
```

**Download PDF Report:**
```bash
GET /api/v1/ingest/report/{job_id}?use_ai=true
```

**Generate Graphs:**
```bash
GET /api/v1/ingest/graphs
```

## Production Deployment

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/trackshift
STORAGE_ENDPOINT=s3.amazonaws.com
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...

# Optional
GEMINI_API_KEY=...              # For AI-powered analysis
LOG_LEVEL=INFO                  # DEBUG|INFO|WARNING|ERROR
WORKERS=4                       # Number of workers
```

### Docker Deployment
```bash
# Build
docker build -t trackshift-ingestion .

# Run
docker run -p 8000:8000 \
  -e DATABASE_URL=... \
  -e STORAGE_ENDPOINT=... \
  trackshift-ingestion
```

### Health Checks
```bash
# Service health
curl http://localhost:8000/health

# Detailed metrics
curl http://localhost:8000/metrics
```

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)**: Detailed setup instructions
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**: Implementation details
- **[CHANGE_DETECTION.md](CHANGE_DETECTION.md)**: Change detection pipeline
- **[PDF_REPORT_SERVICE.md](PDF_REPORT_SERVICE.md)**: PDF generation guide
- **[GEMINI_AI_INTEGRATION.md](GEMINI_AI_INTEGRATION.md)**: AI integration guide

## Performance

- **Processing Time**: 3-8 seconds per analysis
- **PDF Generation**: 2-3 seconds with graphs
- **AI Analysis**: 2-5 seconds (optional)
- **Throughput**: ~10-15 requests/min/worker

## Support

For issues or questions, refer to the documentation or check the logs:
```bash
# View logs
docker logs trackshift-ingestion

# Follow logs
docker logs -f trackshift-ingestion
```

## License

Proprietary - TrackShift Syndicate

---

**Version**: 2.2.0 (Production)  
**Last Updated**: November 16, 2025
