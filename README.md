# 🏎️ TrackShift Syndicate - F1 Visual Intelligence Platform

## Overview
TrackShift is a production-ready AI-powered visual inspection platform for Formula 1 racing vehicles. It combines advanced computer vision, AI analysis, and automated reporting to detect and classify structural changes with unprecedented accuracy.

## 🎯 Key Features

### Backend Engine
- **Change Detection**: LoFTR feature matching + SAM segmentation
- **AI Analysis**: Google Gemini-powered insights and recommendations
- **Component Classification**: ResNet-based F1 part identification
- **PDF Reports**: Comprehensive technical reports with graphs and analysis
- **Data Visualization**: 6 professional analytical graphs
- **Production-Ready**: Error handling, logging, monitoring, Docker support

### Frontend Interface
- **F1-Themed UI**: Professional racing aesthetics
- **Real-Time Analysis**: Live change detection visualization
- **Image Comparison**: Side-by-side before/after views
- **PDF Downloads**: One-click report generation
- **Responsive Design**: Desktop and tablet support

## 🏗️ Architecture

```
TrackShift-Syndicate/
├── services/
│   └── ingestion/           # Backend API service
│       ├── api/             # REST endpoints
│       ├── services/        # Core logic (detection, PDF, AI)
│       ├── models/          # Data schemas
│       └── utils/           # Helpers and logging
│
├── frontend2/               # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API client
│   │   └── styles/          # Styling
│   └── public/              # Static assets
│
└── docs/                    # Documentation
```

## 🚀 Quick Start

### Backend Setup
```bash
cd services/ingestion
pip install -r requirements.txt
cp .env.example .env
# Configure environment variables
uvicorn main:app --reload
```

**API Docs**: http://localhost:8000/docs

### Frontend Setup
```bash
cd frontend2
npm install
npm run dev
```

**Frontend**: http://localhost:5173

### Docker Deployment
```bash
# Backend
cd services/ingestion
docker-compose up -d

# Frontend
cd frontend2
docker build -t trackshift-frontend .
docker run -p 80:80 trackshift-frontend
```

## 📚 Documentation

### Backend
- [Setup Guide](services/ingestion/SETUP_GUIDE.md)
- [Implementation Details](services/ingestion/IMPLEMENTATION_SUMMARY.md)
- [Change Detection Pipeline](services/ingestion/CHANGE_DETECTION.md)
- [PDF Report Service](services/ingestion/PDF_REPORT_SERVICE.md)
- [AI Integration](services/ingestion/GEMINI_AI_INTEGRATION.md)

### Frontend
- [Frontend README](frontend2/README.md)
- [Flow Diagram](frontend2/FLOW_DIAGRAM.md)

### Project Docs
- [Architecture](docs/ARCHITECTURE.md)
- [Problem Statement](docs/PROBLEM_STATEMENT.md)
- [Running Services](docs/RUNNING_SERVICES.md)

## 🔧 Configuration

### Backend Environment
```bash
# Required
DATABASE_URL=postgresql://...
STORAGE_ENDPOINT=s3.amazonaws.com
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...

# Optional
GEMINI_API_KEY=...          # For AI analysis
LOG_LEVEL=INFO
```

### Frontend Environment
```bash
VITE_API_URL=https://api.trackshift.com
```

## 📊 Performance Metrics

- **Analysis Time**: 3-8 seconds
- **PDF Generation**: 2-3 seconds (with graphs)
- **AI Analysis**: 2-5 seconds (optional)
- **Throughput**: ~10-15 requests/min/worker

## 🛠️ Technology Stack

### Backend
- Python 3.8+
- FastAPI
- PyTorch (LoFTR, SAM)
- ReportLab (PDF generation)
- Matplotlib (Graphs)
- Google Gemini AI

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Lucide Icons

### Infrastructure
- Docker + Docker Compose
- PostgreSQL
- S3/MinIO Storage
- Nginx (Production)

## 🔐 Security

- Environment-based configuration
- Secure API key management
- Input validation and sanitization
- Error handling and logging
- Rate limiting support

## 📈 Production Deployment

### Backend
```bash
# Build and deploy
docker build -t trackshift-api services/ingestion
docker run -p 8000:8000 trackshift-api

# Health check
curl http://localhost:8000/health
```

### Frontend
```bash
# Build production bundle
cd frontend2
npm run build

# Deploy dist/ to CDN or static hosting
```

## 🧪 API Endpoints

**Full Analysis Pipeline:**
```bash
POST /pipeline
- baseline: <image_file>
- current: <image_file>
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

## 🤝 Contributing

This is a proprietary project. For access or collaboration inquiries, contact the team.

## 📄 License

Proprietary - TrackShift Syndicate

## 🏆 Team

Built by the TrackShift Syndicate team for advanced F1 vehicle inspection and analysis.

---

**Version**: 2.2.0 (Production)  
**Status**: ✅ Production Ready  
**Last Updated**: November 16, 2025
