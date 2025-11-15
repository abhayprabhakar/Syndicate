"""Segmentation workflow that reproduces the notebook Steps 1-5."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np

from config import get_settings
from services.segmentation.alignment import ImageAligner
from services.segmentation.change_detector import AnyChangeDetector
from services.segmentation.photometric import PhotometricNormalizer
from services.segmentation.sam_predictor import SAMPredictorProvider
from services.segmentation.types import SegmentationArtifacts, SegmentationJobSpec
from utils.logger import get_logger

logger = get_logger(__name__)


def _ratio_to_bbox(
    image_shape: tuple[int, int, int],
    ratio: Tuple[float, float, float, float],
) -> tuple[int, int, int, int]:
    """Convert normalized (x, y, w, h) to absolute (x0, y0, x1, y1)."""
    height, width = image_shape[:2]
    x_norm, y_norm, w_norm, h_norm = ratio
    x0 = max(int(x_norm * width), 0)
    y0 = max(int(y_norm * height), 0)
    x1 = min(int((x_norm + w_norm) * width), width - 1)
    y1 = min(int((y_norm + h_norm) * height), height - 1)
    return x0, y0, x1, y1


def _sanitize_bbox(
    image_shape: tuple[int, int, int],
    bbox: Optional[tuple[int, int, int, int]],
    fallback_ratio: Tuple[float, float, float, float],
) -> tuple[int, int, int, int]:
    if bbox is None:
        return _ratio_to_bbox(image_shape, fallback_ratio)

    x0, y0, x1, y1 = bbox
    height, width = image_shape[:2]
    x0 = int(np.clip(x0, 0, width - 2))
    y0 = int(np.clip(y0, 0, height - 2))
    x1 = int(np.clip(x1, x0 + 1, width - 1))
    y1 = int(np.clip(y1, y0 + 1, height - 1))
    return x0, y0, x1, y1


class SegmentationPipeline:
    """High-level orchestrator that mirrors the SAM notebook Steps 1-5."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.output_dir = Path(self.settings.segmentation.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.sam_provider = SAMPredictorProvider()
        self.aligner = ImageAligner(self.sam_provider.device)
        self.normalizer = PhotometricNormalizer(
            clip_limit=self.settings.segmentation.clahe_clip_limit,
            tile_grid_size=self.settings.segmentation.clahe_tile_grid_size,
        )
        
        # Step 5: Change Detection (lazy initialized only if enabled)
        self.change_detector: Optional[AnyChangeDetector] = None
        if self.settings.segmentation.enable_change_detection:
            self.change_detector = AnyChangeDetector(self.settings.segmentation)

    def run(self, job: SegmentationJobSpec) -> SegmentationArtifacts:
        """Execute Steps 1-5 for the provided baseline/current pair."""
        baseline_img = self._read_image(job.baseline_path, "baseline")
        current_img = self._read_image(job.current_path, "current")

        # Ensure both images have the same dimensions
        if baseline_img.shape != current_img.shape:
            target_height, target_width = baseline_img.shape[:2]
            current_img = cv2.resize(current_img, (target_width, target_height), interpolation=cv2.INTER_LINEAR)

        bbox = _sanitize_bbox(
            baseline_img.shape,
            job.bounding_box,
            self.settings.segmentation.default_bbox_ratio,
        )

        logger.info(
            "segmentation_pipeline_start",
            camera_id=job.camera_id,
            request_id=str(job.request_id),
            bbox=bbox,
            change_detection_enabled=self.change_detector is not None,
        )

        # Step 2: SAM Segmentation
        raw_mask = self.sam_provider.predict_mask(baseline_img, bbox)
        mask = self._prepare_mask(raw_mask, baseline_img.shape)

        masked_baseline = cv2.bitwise_and(baseline_img, baseline_img, mask=mask)
        masked_current = cv2.bitwise_and(current_img, current_img, mask=mask)

        # Step 3: LoFTR Alignment
        aligned_current, alignment_metrics = self.aligner.align(masked_baseline, masked_current)
        
        # Also align the FULL current image for change detection (if enabled)
        if self.change_detector is not None:
            # Align full unmasked current image using same transformation
            aligned_current_full, _ = self.aligner.align(baseline_img, current_img)
        else:
            aligned_current_full = None

        # Step 4: Photometric Normalization (on masked images for quality metrics)
        normalized_baseline_masked, normalized_current_masked, photometric_metrics = self.normalizer.normalize_pair(
            masked_baseline,
            aligned_current,
        )
        
        # Step 5: Change Detection (optional) - use FULL unmasked aligned images
        change_masks = None
        change_count = 0
        change_confidences = None
        change_areas = None
        normalized_baseline_full = None
        normalized_current_full = None
        
        if self.change_detector is not None:
            logger.info("change_detection_starting", camera_id=job.camera_id)
            
            # Optionally normalize the FULL images for saving/visualization
            # But pass RAW aligned images to AnyChange (it does its own preprocessing)
            normalized_baseline_full, normalized_current_full, _ = self.normalizer.normalize_pair(
                baseline_img,
                aligned_current_full,
            )
            
            # Run change detection on ALIGNED images (not normalized)
            # AnyChange will do its own preprocessing internally
            change_masks, change_count, change_confidences, change_areas = self.change_detector.detect_changes(
                baseline_img,  # Pass raw aligned baseline
                aligned_current_full,  # Pass raw aligned current
            )
            logger.info(
                "change_detection_complete",
                camera_id=job.camera_id,
                change_count=change_count,
            )

        # Decide which normalized images to save: full (if change detection) or masked (default)
        normalized_baseline_to_save = normalized_baseline_full if normalized_baseline_full is not None else normalized_baseline_masked
        normalized_current_to_save = normalized_current_full if normalized_current_full is not None else normalized_current_masked

        artifact_paths = self._persist_artifacts(
            job=job,
            baseline=baseline_img,
            current=current_img,
            mask=mask,
            masked_baseline=masked_baseline,
            masked_current=masked_current,
            aligned_current=aligned_current,
            normalized_baseline=normalized_baseline_to_save,
            normalized_current=normalized_current_to_save,
            bbox=bbox,
            metrics={**alignment_metrics, **photometric_metrics},
            change_masks=change_masks,
            change_count=change_count,
        )

        logger.info(
            "segmentation_pipeline_complete",
            camera_id=job.camera_id,
            request_id=str(job.request_id),
            artifacts=list(map(str, artifact_paths.values())),
        )

        return SegmentationArtifacts(
            baseline_image=baseline_img,
            current_image=current_img,
            mask=mask,
            aligned_current=aligned_current,
            normalized_baseline=normalized_baseline_to_save,
            normalized_current=normalized_current_to_save,
            artifact_paths=artifact_paths,
            quality_metrics={**alignment_metrics, **photometric_metrics},
            change_masks=change_masks,
            change_count=change_count,
            change_confidences=change_confidences,
            change_areas=change_areas,
        )

    def _read_image(self, path: Path, label: str) -> np.ndarray:
        if not path.exists():
            raise FileNotFoundError(f"{label.title()} image not found at {path}")
        image = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError(f"Failed to load {label} image at {path}")
        return image

    def _persist_artifacts(
        self,
        job: SegmentationJobSpec,
        baseline: np.ndarray,
        current: np.ndarray,
        mask: np.ndarray,
        masked_baseline: np.ndarray,
        masked_current: np.ndarray,
        aligned_current: np.ndarray,
        normalized_baseline: np.ndarray,
        normalized_current: np.ndarray,
        bbox: tuple[int, int, int, int],
        metrics: dict[str, float],
        change_masks: Optional[any] = None,
        change_count: int = 0,
    ) -> dict[str, Path]:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        run_dir = self.output_dir / job.camera_id / str(job.request_id) / timestamp
        run_dir.mkdir(parents=True, exist_ok=True)

        artifacts: dict[str, Path] = {}

        def _write(name: str, image: np.ndarray) -> None:
            file_path = run_dir / f"{name}.png"
            cv2.imwrite(str(file_path), image)
            artifacts[name] = file_path

        _write("baseline_raw", baseline)
        _write("current_raw", current)
        _write("mask", mask)
        _write("baseline_masked", masked_baseline)
        _write("current_masked", masked_current)
        _write("current_aligned", aligned_current)
        _write("baseline_normalized", normalized_baseline)
        _write("current_normalized", normalized_current)
        
        # Step 5: Save change detection visualizations
        if change_masks is not None and change_count > 0:
            try:
                # Import visualization helper
                from torchange.models.segment_any_change import visualize_change_masks
                
                # Convert BGR to RGB for visualization
                baseline_rgb = cv2.cvtColor(normalized_baseline, cv2.COLOR_BGR2RGB)
                current_rgb = cv2.cvtColor(normalized_current, cv2.COLOR_BGR2RGB)
                
                # Create overlay visualization
                change_viz = visualize_change_masks(baseline_rgb, current_rgb, change_masks)
                
                # Save visualization (convert RGB back to BGR for cv2.imwrite)
                change_viz_path = run_dir / "change_detection_viz.png"
                cv2.imwrite(str(change_viz_path), cv2.cvtColor(change_viz, cv2.COLOR_RGB2BGR))
                artifacts["change_detection_viz"] = change_viz_path
                
                logger.info(
                    "change_detection_viz_saved",
                    path=str(change_viz_path),
                    change_count=change_count,
                )
            except Exception as e:
                logger.warning(
                    "change_detection_viz_failed",
                    error=str(e),
                    message="Could not save change detection visualization",
                )

        metadata_path = run_dir / "metadata.json"
        metadata = {
            "camera_id": job.camera_id,
            "request_id": str(job.request_id),
            "created_at": datetime.utcnow().isoformat(),
            "mask_bbox": list(bbox),
            "input_paths": {
                "baseline": str(job.baseline_path),
                "current": str(job.current_path),
            },
            "artifacts": {key: str(path) for key, path in artifacts.items()},
            "metrics": metrics,
            "change_detection": {
                "enabled": change_masks is not None,
                "change_count": change_count,
            },
            "extra": job.metadata,
        }
        metadata_path.write_text(json.dumps(metadata, indent=2))
        artifacts["metadata"] = metadata_path

        return artifacts

    def _prepare_mask(self, mask: np.ndarray, image_shape: tuple[int, int, int]) -> np.ndarray:
        """Ensure mask is uint8 and matches the target image dimensions."""
        if mask.ndim == 3:
            mask = mask.squeeze()

        if mask.dtype != np.uint8:
            mask = mask.astype(np.uint8)

        target_height, target_width = image_shape[:2]
        if mask.shape[0] != target_height or mask.shape[1] != target_width:
            mask = cv2.resize(mask, (target_width, target_height), interpolation=cv2.INTER_NEAREST)

        return mask


__all__ = ["SegmentationPipeline", "_ratio_to_bbox"]
