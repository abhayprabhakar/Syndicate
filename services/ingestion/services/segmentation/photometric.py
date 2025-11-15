"""Photometric normalization utilities for Step 4 of the workflow."""
from __future__ import annotations

import cv2
import numpy as np
from skimage import exposure, metrics


class PhotometricNormalizer:
    """Apply CLAHE, histogram matching, and compute quality metrics."""

    def __init__(self, clip_limit: float, tile_grid_size: int) -> None:
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size

    def _apply_clahe(self, image_bgr: np.ndarray) -> np.ndarray:
        lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=(self.tile_grid_size, self.tile_grid_size))
        l_eq = clahe.apply(l)
        lab_eq = cv2.merge((l_eq, a, b))
        return cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)

    def _match_histograms(self, source: np.ndarray, reference: np.ndarray) -> np.ndarray:
        matched = exposure.match_histograms(source, reference, channel_axis=-1)
        matched = np.clip(matched, 0, 255)
        return matched.astype(np.uint8)

    def normalize_pair(
        self,
        baseline_bgr: np.ndarray,
        current_bgr: np.ndarray,
    ) -> tuple[np.ndarray, np.ndarray, dict[str, float]]:
        """Apply photometric normalization and return quality metrics."""
        baseline_eq = self._apply_clahe(baseline_bgr)
        current_eq = self._apply_clahe(current_bgr)

        matched_current = self._match_histograms(current_eq, baseline_eq)

        baseline_float = baseline_eq.astype(np.float32)
        current_float = matched_current.astype(np.float32)
        data_range = 255.0

        ssim_value = metrics.structural_similarity(
            baseline_float,
            current_float,
            channel_axis=-1,
            data_range=data_range,
        )
        psnr_value = metrics.peak_signal_noise_ratio(
            baseline_float,
            current_float,
            data_range=data_range,
        )

        metrics_dict = {
            "photometric_ssim": float(ssim_value),
            "photometric_psnr": float(psnr_value),
        }
        return baseline_eq, matched_current, metrics_dict
