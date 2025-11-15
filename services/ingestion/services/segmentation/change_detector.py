"""Step 5: Change Detection using AnyChange (Segment Any Change)."""
from __future__ import annotations

from typing import Any, Tuple

import cv2
import numpy as np
import torch

from config import SegmentationSettings
from utils.logger import get_logger

logger = get_logger(__name__)


class AnyChangeDetector:
    """Wrapper for AnyChange (Segment Any Change) change detection model."""

    def __init__(self, settings: SegmentationSettings) -> None:
        """
        Initialize AnyChange detector.

        Args:
            settings: Segmentation configuration with change detection params
        """
        self.settings = settings
        self._model: Any = None  # Lazy loaded
        self._device: torch.device | None = None

    def _lazy_init(self) -> None:
        """Initialize AnyChange model on first use (lazy loading)."""
        if self._model is not None:
            return

        try:
            from torchange.models.segment_any_change import AnyChange
        except ImportError as e:
            logger.error(
                "change_detection_import_failed",
                error=str(e),
                message="pytorch-change-models not installed. Run: pip install git+https://github.com/Z-Zheng/pytorch-change-models.git",
            )
            raise

        logger.info(
            "anychange_initializing",
            model_type=self.settings.sam_model_type,
            checkpoint=self.settings.sam_checkpoint_path,
        )

        # Initialize AnyChange with SAM checkpoint
        self._model = AnyChange(
            model_type=self.settings.sam_model_type,
            sam_checkpoint=self.settings.sam_checkpoint_path,
        )

        self._device = self._model.device
        logger.info("anychange_initialized", device=str(self._device))

        # Configure mask generator
        self._model.make_mask_generator(
            points_per_side=self.settings.change_points_per_side,
            stability_score_thresh=self.settings.change_stability_score_thresh,
            pred_iou_thresh=self.settings.change_pred_iou_thresh,
            box_nms_thresh=self.settings.change_box_nms_thresh,
        )

        # Set hyperparameters
        self._model.set_hyperparameters(
            change_confidence_threshold=self.settings.change_confidence_threshold,
            use_normalized_feature=self.settings.change_use_normalized_feature,
            bitemporal_match=self.settings.change_bitemporal_match,
            match_hist=True,  # Let AnyChange do its own histogram matching
            area_thresh=self.settings.change_area_thresh,
        )

        logger.info(
            "anychange_configured",
            confidence_threshold=self.settings.change_confidence_threshold,
            use_normalized=self.settings.change_use_normalized_feature,
            bitemporal=self.settings.change_bitemporal_match,
        )

    def detect_changes(
        self,
        baseline_bgr: np.ndarray,
        current_bgr: np.ndarray,
    ) -> Tuple[Any, int, np.ndarray | None, np.ndarray | None]:
        """
        Detect changes between baseline and current images using AnyChange.

        Args:
            baseline_bgr: Baseline image (BGR, uint8)
            current_bgr: Current image (BGR, uint8)

        Returns:
            Tuple of (change_masks, change_count, confidences, areas)
            - change_masks: AnyChange mask container (RLE-encoded)
            - change_count: Number of detected changes
            - confidences: Confidence scores for each change (or None)
            - areas: Pixel areas for each change (or None)
        """
        self._lazy_init()

        # Convert BGR to RGB (AnyChange expects RGB)
        baseline_rgb = cv2.cvtColor(baseline_bgr, cv2.COLOR_BGR2RGB)
        current_rgb = cv2.cvtColor(current_bgr, cv2.COLOR_BGR2RGB)

        logger.info(
            "anychange_detecting",
            baseline_shape=baseline_rgb.shape,
            current_shape=current_rgb.shape,
        )

        # Run AnyChange forward pass
        # Returns: (change_masks, baseline_masks, current_masks)
        change_masks, _, _ = self._model.forward(baseline_rgb, current_rgb)

        # Extract metadata
        change_count = len(change_masks["rles"])

        confidences = None
        areas = None

        if change_count > 0:
            # Extract confidence scores
            if "change_confidence" in change_masks._asdict():
                confidences = change_masks["change_confidence"].cpu().numpy()

            # Extract areas
            if "areas" in change_masks._stats:
                areas_raw = change_masks["areas"]
                if isinstance(areas_raw, torch.Tensor):
                    areas = areas_raw.cpu().numpy()
                else:
                    areas = np.array(areas_raw)

        logger.info(
            "anychange_complete",
            change_count=change_count,
            has_confidences=confidences is not None,
            has_areas=areas is not None,
            avg_confidence=float(confidences.mean()) if confidences is not None else None,
            total_area=int(areas.sum()) if areas is not None else None,
        )

        return change_masks, change_count, confidences, areas

    @property
    def device(self) -> torch.device:
        """Get the device used by AnyChange."""
        if self._device is None:
            self._lazy_init()
        return self._device
