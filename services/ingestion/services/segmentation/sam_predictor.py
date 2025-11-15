"""Thin wrapper around the Segment Anything predictor."""
from __future__ import annotations

import threading
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
import torch
from segment_anything import SamPredictor, sam_model_registry

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)


class SAMPredictorProvider:
    """Lazily constructs and caches a SAM predictor instance."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._predictor: Optional[SamPredictor] = None
        self._device = self._resolve_device()
        self._lock = threading.Lock()

    @property
    def device(self) -> torch.device:
        """Device used by the predictor."""
        return self._device

    def _resolve_device(self) -> torch.device:
        requested = self.settings.segmentation.device
        if requested.startswith("cuda"):
            if torch.cuda.is_available():
                return torch.device(requested)
            logger.warning(
                "cuda_unavailable_falling_back_to_cpu",
                requested_device=requested,
            )
        return torch.device("cpu")

    def _load_predictor(self) -> SamPredictor:
        with self._lock:
            if self._predictor is not None:
                return self._predictor

            checkpoint_path = Path(self.settings.segmentation.sam_checkpoint_path)
            if not checkpoint_path.exists():
                raise FileNotFoundError(
                    f"SAM checkpoint not found at {checkpoint_path}. Update SEGMENTATION_SAM_CHECKPOINT_PATH."
                )

            model_type = self.settings.segmentation.sam_model_type
            if model_type not in sam_model_registry:
                raise ValueError(
                    f"Invalid SAM model type '{model_type}'. Expected one of {list(sam_model_registry.keys())}."
                )

            logger.info(
                "loading_sam_model",
                checkpoint=str(checkpoint_path),
                model_type=model_type,
                device=str(self._device),
            )

            sam_model = sam_model_registry[model_type](checkpoint=str(checkpoint_path))
            sam_model.to(device=self._device)
            sam_model.eval()

            self._predictor = SamPredictor(sam_model)
            return self._predictor

    def get_predictor(self) -> SamPredictor:
        """Public accessor that loads the predictor on first use."""
        if self._predictor is None:
            return self._load_predictor()
        return self._predictor

    def predict_mask(
        self,
        image_bgr: np.ndarray,
        bbox_xyxy: Tuple[int, int, int, int],
    ) -> np.ndarray:
        """Generate a binary mask for the provided bounding box."""
        predictor = self.get_predictor()

        # SAM expects RGB float image in HWC
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        predictor.set_image(image_rgb)

        box = np.array([bbox_xyxy], dtype=np.float32)
        masks, _, _ = predictor.predict(
            box=box,
            multimask_output=False,
        )
        mask = masks[0]
        return (mask.astype(np.uint8) * 255)
