# 1 — High-level user flow (what the user sees)

1. **Start**: User chooses source: “Live camera (RTSP)” or “Upload images (manual)”.
2. **Capture/ingest**: System grabs frames (single frames or stream segment).
3. **Segmentation**: System shows car mask and lets user refine (optional).
4. **Alignment & normalization** happen automatically.
5. **Change detection** runs and displays a heatmap + candidate regions.
6. **Gemini call**: each candidate is sent to Gemini (or LLM) with context + mask to classify the part and provide reasoning.
7. **XAI** overlays (GradCAM / saliency / mask) are shown.
8. **User action**: accept/annotate/override. If corrected, the system fine-tunes or saves for few-shot adaptation.
9. **Export**: generate PDF/CSV with metrics; optionally compute a SHA256 hash and notarize (IPFS/EVM/Notary).

---

# 2 — Modular architecture (components & responsibilities)

```
[ Clients: Web UI / Mobile / CLI ]
            |
         REST/gRPC
            |
   [ API Gateway / Auth Layer ]
            |
   +-----------------------------+
   | Ingestion Service           |
   | - RTSP / File uploader      |
   | - Frame extractor, triggers |
   +-----------------------------+
            |
   [ Preprocessing Worker Pool ]
   - Segmentation (SAM / Mask2Former)
   - Car part segmentation + ROI extraction
   - Alignment (keypoints/RANSAC)
   - Photometric normalization
            |
   [ Change-Detection Engine ]
   - Siamese/Transformer model inference
   - Produces change probability map
            |
   [ Post-processing Service ]
   - Region extraction, morphological ops, metric calc
   - Uncertainty Estimator (MC Dropout/Ensemble)
            |
   [ Classifier / LLM Orchestrator ]
   - Few-shot classifier (ProtoNet/Adapter) OR
   - Calls Gemini API with structured prompt + mask
            |
   [ XAI Service ]
   - GradCAM / Saliency => overlays
            |
   [ Human-in-loop / Feedback UI ]
   - Manual labels, corrections -> store in DB
            |
   [ Report Generator & Notarizer ]
   - PDF/CSV generation, image overlays
   - Compute SHA256, optional IPFS upload / smart-contract call
            |
   [ DB / Object Storage / Telemetry ]
   - Postgres (metadata), MinIO/S3 (images), Redis (cache), Prometheus
```

### Component details

**API Gateway / Auth**

* Expose endpoints for: ingest, status, infer, annotate, report, admin.
* Auth: JWT for UI; mTLS for camera feeds.
* Rate-limits to avoid spamming the LLM (Gemini cost control).

**Ingestion Service**

* Accept two source types:

  * RTSP stream (e.g., `rtsp://user:pass@camera:554/stream`) via GStreamer or ffmpeg
  * Manual upload (single/multi images, zip)
* For RTSP: capture periodic frames (configurable FPS or event-driven via motion detection).
* Frame metadata: `camera_id`, `timestamp`, `frame_id`, `exposure`, `sensor_info` (if available).
* Persist raw frames to object storage (S3/MinIO) and write metadata to Postgres.

**Preprocessing Worker**

* **Segmentation**:

  * Primary: SAM (Segment Anything) for fast zero-shot masks.
  * Alternate: Mask2Former for finer part segmentation (if you have labels).
  * Output: binary mask(s) per frame, instance ids.
* **Car Mask**: unify per-frame masks to single car instance (choose largest connected instance or prompt-based).
* **ROI extraction**: extract candidate part bounding boxes via morphological ops + connected components on mask diff.
* **Alignment**:

  * Keypoints: SuperPoint/ORB/SIFT (choose depending on license & speed).
  * Matcher: SuperGlue / FLANN.
  * Robust estimate: RANSAC → homography/affine.
* **Photometric normalization**: histogram matching / CLAHE / exposure mapping to reduce lighting noise.
* Save aligned images and normalized versions.

**Change-Detection Engine**

* Input: aligned normalized pair (ref, curr) cropped by car mask or whole image.
* Models:

  * Transformer option: ChangeFormer (Siamese ViT) for high precision.
  * CNN option: Siamese U-Net / SNUNet-CD for fast inference.
* Output: per-pixel probability map (float32), binary change mask (thresholded), confidence map.
* Recommendation: use multi-scale input (512/768/1024 crops) to detect both tiny chips & big parts.

**Post-processing**

* Morphological cleanup (opening/closing), merge nearby regions (IoU threshold).
* Compute metrics: area (px & mm² if calibration available), bounding box coords, length estimates for cracks (skeletonization).
* Filter false positives with simple heuristics (e.g., below min-area, only transient classes).
* Produce final candidate regions with `region_id`, `score`, `mask_uri`, `bbox`.

**Uncertainty Estimation**

* Monte Carlo Dropout: 5-10 forward passes with dropout active → pixel variance.
* Ensemble: maintain 2-3 models with different initializations.
* Output: per-region uncertainty score (0..1), used for human triage.

**Classifier / LLM Orchestrator**

* Two-tiered approach:

  1. **Few-shot classifier**: For known parts (front wing, rear wing, bargeboards, floor, halo, mirror). Use prototype networks (LightningFSL) or adapter-based CLIP embeddings. Quick inference and cheap.
  2. **Gemini API**: Build a structured prompt pipeline and call Gemini to provide:

     * **Part identification** given mask image and context.
     * **Detailed natural-language diagnosis**: cause hypothesis, severity, action suggestions, rule-of-thumb measurement.
* Prompt structure (example):

  ```
  Input: aligned_before.png, aligned_after.png, region_mask.png, bounding_box coordinates, area: 12.8 cm^2
  System: You are an F1 scrutineer assistant.
  Task: Identify which car part the region corresponds to and provide likely cause, severity (low/med/high), and suggested action.
  Support: Provide 3 bullet recommended checks and a short plain explanation of evidence.
  ```
* Gemini returns `part_label`, `confidence`, `rationale`, `recommended_action`. Also include a short human-friendly explanation.

**XAI Service**

* Run `pytorch-grad-cam` or Captum on detection/classifier model for the relevant region to produce heatmaps.
* Combine: change-mask heatmap + GradCAM overlay + LLM rationale into a single annotated image.

**Human-in-loop**

* UI allows brush/erase of masks, accept/reject labels, leave comments.
* Feedback stored as labeled examples; on accepted corrections trigger:

  * Add to few-shot support set OR
  * Queue for periodic fine-tuning (adapter or LoRA) depending on infra.

**Report Generator & Notarizer**

* Compose report: input images, annotated overlays, labels, metrics (mm/cm²), timestamp, camera ID, uncertainty.
* PDF generation with FPDF2 or ReportLab. Include JSON machine-readable report.
* Compute SHA-256 of PDF (and optionally the JSON), upload to IPFS, and optionally send CID to smart contract (or send only hash to public notary). Store txid in DB.

**DB & Storage**

* Object storage (S3/MinIO) for frames, masks, overlays.
* Postgres for metadata (inference results, user annotations, camera configs).
* Redis for transient caching & job queue (RQ / Celery).
* Prometheus + Grafana for metrics.

---

# 3 — Sequence / Data-flow (quick ASCII)

```
User UI  --> POST /analyze  (source: rtsp or images)
   |
Ingestion service (frame saved) --> Preprocessing queue
   |                                |
   |                            segmentation (SAM) -> car_mask
   |                                |
   |                            alignment -> aligned pair
   |                                |
   +--> ChangeDetectionEngine ------+
               |                    |
          change_mask               |
               |                    |
        post-processing (regions)   |
               |                    |
   regions -> FewShotClassifier ----+
               |                    |
          If unknown -> call Gemini API (LLM)
               |
        XAI overlays (GradCAM)
               |
     Generate report (PDF + JSON) -> compute hash
               |
     (Optional) Upload to IPFS & write hash on-chain
               |
     Return response to UI with images + JSON
```

---

# 4 — Data contracts & example JSON

**API: POST /analyze (body for manual images)**

```json
{
  "source_type": "upload",
  "images": ["s3://bucket/ref.jpg", "s3://bucket/curr.jpg"],
  "camera_id": "Haas_Pit_1",
  "meta": {"session":"FP1","timestamp_ref":"2025-11-15T12:05:00+05:30"}
}
```

**API: POST /analyze (RTSP)**

```json
{
  "source_type": "rtsp",
  "rtsp_url": "rtsp://user:pass@10.0.0.5:554/stream",
  "capture_mode": "single_frame", 
  "frame_timestamp": "2025-11-15T12:05:00+05:30"
}
```

**Response (successful)**

```json
{
  "request_id": "req_abc123",
  "status": "done",
  "results": [
    {
      "region_id": "r1",
      "label": "front_wing_endplate",
      "label_conf": 0.92,
      "change_area_px": 1834,
      "change_area_mm2": 1280,
      "bbox": [102,34,230,98],
      "uncertainty": 0.08,
      "rationale": "Observed paint removed near leading edge; region shows carbon substrate exposure consistent with kerb strike.",
      "overlays": {
         "mask_image": "s3://bucket/overlays/req_abc123_r1_mask.png",
         "gradcam": "s3://bucket/overlays/req_abc123_r1_gradcam.png"
      }
    }
  ],
  "report": {
    "pdf": "s3://bucket/reports/req_abc123_report.pdf",
    "sha256": "8a3f..."
  }
}
```

---

# 5 — Implementation & infra notes

**Language / frameworks**

* Backend: Python (FastAPI) or Flask for quick prototyping. Use gRPC for internal high-throughput comms if needed.
* Worker: Celery or RQ with Redis.
* Models & training: PyTorch recommended (ease of gradcam, LoRA, DINO, ChangeFormer examples).
* Frontend: React + Tailwind (fast), show overlays, brush tools.

**GPU & perf**

* Detection + segmentation needs GPU for real-time-ish.
* For demo: one RTX 3090 / A5000 or A100 for fastest; NVidia 3060/3070 still fine for single-stream inference at 512–1024 px.
* CPU fallback: use ORB + threshold baseline (slower, less precise).

**Containerization**

* Dockerize each service: ingestion, preprocess, model-infer, LLM-orchestrator (calls remote Gemini), xai, report-generator.
* Orchestrate with docker-compose for hackathon / dev; Kubernetes for production.

**Latency**

* Per single pair (segmentation + change detection + LLM call) — expect:

  * Segmentation (SAM): 50–300 ms on GPU depending size.
  * Change model: 100–400 ms.
  * LLM (Gemini): depends on remote API latency (200–1000+ ms).
* To keep demo snappy: run async inference; show quick heatmap from cheap baseline while full model runs.

---

# 6 — Security, privacy & operations

**Camera & RTSP**

* Use VPN / private network; avoid exposing camera credentials publicly. Use per-camera API keys, mTLS, or VPN peering.
* Save only hashes of sensitive frames if policy requires; store raw only in secure S3 with IAM.

**LLM & PII**

* Sanitize data sent to Gemini: remove any personal info in annotations.
* Rate limit and monitor Gem API usage and cost.

**Access controls**

* RBAC in UI: viewer, annotator, admin.
* Audit log for all manual overrides.

**Data retention**

* Define retention policy for raw frames (e.g., 30 days) and archived reports (1-5 years as needed).

---

# 7 — Metrics & monitoring

* Detection metrics: Precision/Recall/F1 on a labeled validation set (use CarDD / MVTec as proxy).
* Operational metrics: inference latency, queue length, GPU utilization, LLM cost/time, false-positive rate (user-corrected).
* Set alerting on high false-positive trend or sudden increase in uncertainty.

---

# 8 — Testing & dataset suggestions for dev

* For quick prototyping: use **CarDD**, **MVTec AD** and synthetic pairs (paste scratches/decals on clean car images) to create before/after.
* Create synthetic kerb-strike samples by overlaying chips/cracks with alpha masks; simulate lighting changes.
* Unit test each module with mocked inputs (masks, homography).

---

# 9 — Example minimal endpoints & pseudo-code (FastAPI style)

`POST /api/v1/analyze` triggers pipeline (accepts RTSP or upload).
`GET /api/v1/result/{request_id}` returns JSON result.
`POST /api/v1/annotate/{request_id}/{region_id}` stores human correction.

Pseudo: segmentation + detect + LLM (very simplified)

```python
# simplified example
ref = load_image(s3_ref)
curr = load_image(s3_curr)

# segmentation
mask = sam_predictor.predict_mask(curr)

# alignment
H = estimate_homography(ref, curr, mask)
aligned_ref = warp(ref, H)

# normalization
ref_n, curr_n = photometric_match(aligned_ref, curr)

# detect
change_prob = model.predict_pair(ref_n, curr_n)
change_mask = (change_prob > 0.5)

# extract regions
regions = extract_connected_regions(change_mask)

# for each region call LLM
for r in regions:
    patch = crop(curr, r.bbox)
    prompt = build_prompt(ref_patch, patch, region_metrics)
    llm_out = call_gemini(prompt)  # structured response expected
    save_result(...)
```

---

# 10 — MVP roadmap (what to build first — ordered)

1. Build ingestion (upload + RTSP capture) and store frames.
2. Implement a **baseline differencing demo**: align via ORB + homography, histogram-match, absolute diff + threshold → show masks. (This gives a working demo quickly.)
3. Add segmentation (SAM) to isolate car and show overlay.
4. Add a Siamese U-Net change detector (pretrained backbone) and display heatmap.
5. Integrate GradCAM for interpretability and show overlay.
6. Add Gemini API prompt pipeline for part classification; show LLM rationale.
7. Add human annotation UI and store corrections.
8. Add report generation & SHA256 notarization (optional IPFS).
9. Add few-shot adaptation and LoRA/adapter fine-tuning for domain adaptation.

---

# 11 — Practical tips / gotchas

* **Lighting is the enemy.** Photometric normalization + hard-negative training (images that only differ in lighting) will reduce false alarms.
* **Occluders (people/doffs)**: mask people/garage background using instance segmentation (detect persons and ignore).
* **Scale calibration**: if you want mm measurements, you must calibrate camera (intrinsics or known reference object) or accept relative areas only.
* **LLM hallucination**: keep LLM prompts constrained and use prototype classifier for final label; show LLM as “explainable assistant” not sole truth.
* **Cost control**: batch LLM calls or only call LLM for high-uncertainty/unknown labels.

---

# 12 — Deliverables I can generate next (pick one)

* a) **Docker-compose skeleton** with services and sample FastAPI endpoints + sample request/response.
* b) **Starter FastAPI repo scaffold** that accepts RTSP/upload, runs SAM and an example Siamese U-Net inference (with instructions).
* c) **Detailed PDF report template** with fields, visuals, and the exact JSON schema for anchoring to blockchain.
* d) **Prototype prompt templates** for Gemini (structured prompts + safety/temperature settings).
