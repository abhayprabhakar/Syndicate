# Step 5: Change Detection Integration

## Overview

Step 5 adds **AnyChange** (Segment Any Change) change detection to the segmentation pipeline. This optional step detects visual differences between the normalized baseline and current images from Steps 1-4.

## Architecture

### Components

1. **`services/segmentation/change_detector.py`**
   - `AnyChangeDetector`: Wrapper for the AnyChange model
   - Lazy initialization (only loads when first used)
   - Configurable via `SegmentationSettings`

2. **Updated `services/segmentation/pipeline.py`**
   - Integrated Step 5 after photometric normalization
   - Conditionally runs based on `enable_change_detection` config flag
   - Persists change visualizations and metadata

3. **Updated `services/segmentation/types.py`**
   - Added change detection fields to `SegmentationArtifacts`:
     - `change_masks`: RLE-encoded mask container from AnyChange
     - `change_count`: Number of detected changes
     - `change_confidences`: Per-change confidence scores
     - `change_areas`: Per-change pixel areas

## Configuration

### Environment Variables

```bash
# Enable/disable change detection (default: false)
SEGMENTATION_ENABLE_CHANGE_DETECTION=true

# Change confidence threshold (lower = more sensitive, default: 145)
SEGMENTATION_CHANGE_CONFIDENCE_THRESHOLD=145

# Use normalized features for lighting robustness (default: true)
SEGMENTATION_CHANGE_USE_NORMALIZED_FEATURE=true

# Match masks bidirectionally (default: true)
SEGMENTATION_CHANGE_BITEMPORAL_MATCH=true

# Filter masks > this ratio of image area (default: 0.8)
SEGMENTATION_CHANGE_AREA_THRESH=0.8

# SAM grid density: 32x32 = 1024 points (default: 32)
SEGMENTATION_CHANGE_POINTS_PER_SIDE=32

# SAM stability threshold (default: 0.95)
SEGMENTATION_CHANGE_STABILITY_SCORE_THRESH=0.95

# SAM IoU quality threshold (default: 0.88)
SEGMENTATION_CHANGE_PRED_IOU_THRESH=0.88

# NMS threshold for overlapping masks (default: 0.7)
SEGMENTATION_CHANGE_BOX_NMS_THRESH=0.7
```

### Python Config

```python
from config import get_settings

settings = get_settings()

# Check if change detection is enabled
if settings.segmentation.enable_change_detection:
    print("Change detection enabled")
    print(f"Confidence threshold: {settings.segmentation.change_confidence_threshold}")
```

## Dependencies

### Required Packages

Added to `requirements.txt`:

```txt
ever-beta>=0.2.0
git+https://github.com/Z-Zheng/pytorch-change-models.git
```

### Installation

```powershell
# Install all dependencies including change detection
pip install -r requirements.txt

# Or install change detection dependencies separately
pip install ever-beta
pip install git+https://github.com/Z-Zheng/pytorch-change-models.git
```

## Usage

### Command Line (Demo Script)

```powershell
cd services\ingestion

# Run with change detection enabled
$env:SEGMENTATION_ENABLE_CHANGE_DETECTION="true"
python testing\run_segmentation_demo.py

# Or use the helper script
testing\test_change_detection.bat
```

### Python API

```python
from pathlib import Path
from uuid import uuid4
from services.segmentation import SegmentationPipeline, SegmentationJobSpec

# Ensure change detection is enabled via environment variable
# or .env file: SEGMENTATION_ENABLE_CHANGE_DETECTION=true

pipeline = SegmentationPipeline()

job = SegmentationJobSpec(
    baseline_path=Path("baseline.jpg"),
    current_path=Path("current.jpg"),
    camera_id="TestCamera",
    request_id=uuid4(),
)

artifacts = pipeline.run(job)

# Access change detection results
if artifacts.change_count > 0:
    print(f"Detected {artifacts.change_count} changes")
    print(f"Avg confidence: {artifacts.change_confidences.mean():.3f}")
    print(f"Total changed pixels: {artifacts.change_areas.sum()}")
    
    # Visualization saved to:
    viz_path = artifacts.artifact_paths.get("change_detection_viz")
    print(f"Visualization: {viz_path}")
```

## Output Artifacts

When change detection is enabled, additional artifacts are generated:

### Files

```
outputs/segmentation/<camera_id>/<request_id>/<timestamp>/
├── baseline_raw.png
├── current_raw.png
├── mask.png
├── baseline_masked.png
├── current_masked.png
├── current_aligned.png
├── baseline_normalized.png
├── current_normalized.png
├── change_detection_viz.png  # ← NEW: Change visualization overlay
└── metadata.json              # Updated with change detection stats
```

### Metadata JSON

```json
{
  "camera_id": "TestCamera",
  "request_id": "abc123...",
  "created_at": "2025-11-15T10:30:00",
  "mask_bbox": [50, 100, 950, 500],
  "input_paths": {
    "baseline": "/path/to/baseline.jpg",
    "current": "/path/to/current.jpg"
  },
  "artifacts": {
    "baseline_raw": "outputs/.../baseline_raw.png",
    "change_detection_viz": "outputs/.../change_detection_viz.png"
  },
  "metrics": {
    "alignment_matches": 1234,
    "alignment_inlier_ratio": 0.85,
    "photometric_ssim": 0.92,
    "photometric_psnr": 28.5
  },
  "change_detection": {
    "enabled": true,
    "change_count": 15
  }
}
```

## How It Works

### Pipeline Flow

```
Step 1: Image Loading
    ↓
Step 2: SAM Segmentation (mask generation with bounding box)
    ↓
Step 3: LoFTR Alignment (feature matching + homography)
    ↓
Step 4: Photometric Normalization (CLAHE + histogram matching)
    ↓
Step 5: Change Detection (AnyChange on normalized images) ← NEW!
    ↓
Artifact Persistence (save all outputs + metadata)
```

### Change Detection Algorithm (AnyChange)

1. **SAM Mask Generation**: Generate candidate masks on both images using SAM's automatic mask generator
2. **Feature Extraction**: Extract SAM image embeddings for each mask
3. **Bitemporal Matching**: Match masks between baseline and current images
4. **Change Scoring**: Compute change confidence based on feature similarity
5. **Filtering**: Apply confidence threshold and area filtering
6. **Output**: RLE-encoded change masks with metadata

## Performance

### Resource Usage

- **Memory**: ~5-8 GB GPU memory (or ~12 GB CPU memory)
- **Time**: 10-30 seconds per image pair on GPU, 60-120 seconds on CPU
- **Model Size**: SAM checkpoint is ~2.4 GB (reuses the same checkpoint from Steps 1-4)

### Optimization Tips

1. **GPU Acceleration**: Set `SEGMENTATION_DEVICE=cuda` for 3-5x speedup
2. **Batch Processing**: Process multiple image pairs in sequence (model only loads once)
3. **Lazy Loading**: AnyChange model only loads when first change detection is triggered

## Troubleshooting

### Import Errors

**Problem**: `ImportError: No module named 'torchange'`

**Solution**:
```powershell
pip install ever-beta
pip install git+https://github.com/Z-Zheng/pytorch-change-models.git
```

### Memory Errors

**Problem**: `CUDA out of memory`

**Solution**:
```powershell
# Switch to CPU
$env:SEGMENTATION_DEVICE="cpu"

# Or reduce grid density
$env:SEGMENTATION_CHANGE_POINTS_PER_SIDE="16"
```

### No Changes Detected

**Problem**: `change_count: 0` even when images are different

**Solutions**:
1. Lower confidence threshold: `SEGMENTATION_CHANGE_CONFIDENCE_THRESHOLD=100`
2. Check alignment quality (poor alignment → false negatives)
3. Verify image normalization (check `baseline_normalized.png` and `current_normalized.png`)

### Too Many False Positives

**Problem**: Many low-confidence changes detected

**Solutions**:
1. Raise confidence threshold: `SEGMENTATION_CHANGE_CONFIDENCE_THRESHOLD=180`
2. Increase stability threshold: `SEGMENTATION_CHANGE_STABILITY_SCORE_THRESH=0.98`
3. Raise IoU threshold: `SEGMENTATION_CHANGE_PRED_IOU_THRESH=0.92`

## Testing

### Unit Tests

```python
# tests/test_change_detector.py
def test_change_detector_initialization():
    from services.segmentation.change_detector import AnyChangeDetector
    from config import get_settings
    
    settings = get_settings()
    detector = AnyChangeDetector(settings.segmentation)
    
    assert detector.device is not None

def test_change_detection_output_shape():
    # ... test change detection returns expected types
```

### Integration Tests

```powershell
# Run the demo script with change detection
cd services\ingestion
$env:SEGMENTATION_ENABLE_CHANGE_DETECTION="true"
python testing\run_segmentation_demo.py

# Verify outputs exist
if (Test-Path "outputs\segmentation\*\*\*\change_detection_viz.png") {
    Write-Host "✓ Change detection artifacts generated"
} else {
    Write-Host "✗ Change detection failed"
}
```

## Future Enhancements

### Planned (Steps 6-9)

- **Step 6**: Few-shot part classification (classify detected changes by car part)
- **Step 7**: Uncertainty estimation (confidence intervals for detections)
- **Step 8**: XAI overlays (GradCAM for explainability)
- **Step 9**: Report generation (automated HTML/PDF summaries)

### Potential Improvements

- [ ] Parallel processing for multiple image pairs
- [ ] Change tracking over time (temporal analysis)
- [ ] Configurable visualization styles (heatmaps, contours, bounding boxes)
- [ ] Export change masks to COCO/Pascal VOC formats
- [ ] API endpoint for change detection results retrieval

## References

- **AnyChange Paper**: [Segment Any Change](https://arxiv.org/abs/2402.01188)
- **pytorch-change-models**: https://github.com/Z-Zheng/pytorch-change-models
- **SAM (Segment Anything)**: https://github.com/facebookresearch/segment-anything
- **LoFTR**: https://github.com/zju3dv/LoFTR

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `services/ingestion/logs/`
3. Open an issue in the repository with:
   - Environment details (OS, Python version, CUDA version)
   - Configuration settings (sanitize secrets!)
   - Error messages and stack traces
   - Sample images (if possible)
