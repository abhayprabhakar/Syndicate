# Running TrackShift Services

This guide shows how to stand up the ingestion API plus the Step 1	3 segmentation pipeline that mirrors the reference notebook. Commands assume Windows PowerShell; adjust paths if you are on another OS.

---

## 1. Prerequisites
- Python 3.11+ with `pip`
- Git
- (Optional) CUDA-capable GPU + drivers if you plan to run SAM/LoFTR/SAC on GPU
- Docker Desktop for the bundled PostgreSQL, MinIO, and Redis services

Verify versions:
```powershell
python --version
pip --version
docker --version
```

---

## 2. Clone & Base Environment
```powershell
cd C:\Users\abhay\Documents\VSCode
# Already cloned, but included for completeness
# git clone https://github.com/abhayprabhakar/TrackShift-Syndicate.git
cd TrackShift-Syndicate\services\ingestion
```

Create and activate a virtual environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

GPU builds: install the correct torch/cu* wheels per https://pytorch.org if needed.

---

## 3. Configuration
1. Copy the default environment file:
   ```powershell
   copy .env.example .env
   ```
2. Update `.env` with your secrets and endpoints (PostgreSQL, MinIO, Redis, JWT secret, etc.).
3. Optional segmentation overrides (examples):
   ```powershell
   setx SEGMENTATION_DEVICE "cpu"             # or cuda
   setx SEGMENTATION_ENABLE_CHANGE_DETECTION "true"
   setx SEGMENTATION_CHANGE_CONFIDENCE_THRESHOLD "80"
   ```

> Keep `.env` out of source control; the repo-level `.gitignore` already handles this.

---

## 4. Supporting Infrastructure (Docker Compose)
From `services/ingestion`:
```powershell
docker compose up -d postgres redis minio
```
- PostgreSQL: localhost:5432 (`postgres` / `postgres` by default)
- MinIO: API on 9000, console on 9001 (`minioadmin` / `minioadmin`)
- Redis: localhost:6379

Check container state:
```powershell
docker compose ps
```

You can stop the stack with `docker compose down` when finished.

---

## 5. Run the Ingestion API Service
With the virtual environment active and dependencies installed:
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
For production-style serving:
```powershell
gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```

### Health & Docs
- Health check: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Smoke test upload
```powershell
curl -X POST "http://localhost:8000/api/v1/ingest/upload" `
  -H "Content-Type: multipart/form-data" `
  -F "camera_id=DemoCam" `
  -F "files=@C:/path/to/before.jpg" `
  -F "files=@C:/path/to/after.jpg"
```

---

## 6. Segmentation & Change Detection Pipeline
The notebook workflow (Steps 1	5) is codified in `services/ingestion/services/segmentation`. To run the demo on the sample F1 images:

```powershell
cd services\ingestion
$env:SEGMENTATION_ENABLE_CHANGE_DETECTION = "true"
$env:SEGMENTATION_DEVICE = "cpu"      # or cuda
$env:SEGMENTATION_CHANGE_CONFIDENCE_THRESHOLD = "80"
python testing\run_segmentation_demo.py
```
Artifacts land under `services/ingestion/outputs/segmentation/<camera>/<request>/<timestamp>/` and include:
- `*_raw.png`, `*_masked.png`
- `current_aligned.png`
- `baseline_normalized.png`, `current_normalized.png`
- `change_detection_viz.png` (when AnyChange finds differences)
- `metadata.json` with metrics (alignment SSIM/PSNR, change counts, etc.)

To run against custom images:
```powershell
python testing\run_segmentation_demo.py `
  --baseline C:\data\before.jpg `
  --current C:\data\after.jpg `
  --camera-id HaasPit01
```
Optional args: `--bbox x0,y0,x1,y1`, `--metadata '{"session":"FP1"}'`.

---

## 7. Full Service Workflow
1. Start infra (Postgres/MinIO/Redis) via Docker Compose.
2. Launch `uvicorn main:app ...` to serve ingestion APIs.
3. POST new frames via upload or RTSP endpoints.
4. The ingestion orchestrator stores frames and can invoke the segmentation pipeline with change detection if `SEGMENTATION_ENABLE_CHANGE_DETECTION=true` is set in the environment for the worker process.
5. Inspect artifacts/logs under `services/ingestion/outputs` and MinIO bucket `trackshift-frames`.

---

## 8. Troubleshooting
- **Missing SAM checkpoint**: download `sam_vit_h_4b8939.pth` into `services/ingestion/models/` (see `frontend/README` for links).
- **CUDA issues**: set `SEGMENTATION_DEVICE=cpu` to fall back or install matching CUDA toolkit.
- **No change masks detected**: lower `SEGMENTATION_CHANGE_CONFIDENCE_THRESHOLD`, or verify images are aligned; raw images are saved for manual inspection.
- **Docker ports busy**: adjust `docker-compose.yml` mappings for Postgres/MinIO/Redis.

---

## 9. Useful Commands Reference
```powershell
# Run ingestion unit tests
pytest

# Tail structured logs
Get-Content logs\ingestion.log -Wait

# Clean generated artifacts
Remove-Item outputs -Recurse -Force

# Stop Docker stack
docker compose down
```

Keep this document alongside `services/ingestion/SETUP_GUIDE.md` for deeper architectural details.
