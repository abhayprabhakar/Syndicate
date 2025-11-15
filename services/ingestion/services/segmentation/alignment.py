"""Image alignment utilities leveraging LoFTR correspondences."""
from __future__ import annotations

import cv2
import numpy as np
import torch
from kornia.feature import LoFTR

from utils.logger import get_logger

logger = get_logger(__name__)


class ImageAligner:
    """Aligns the current frame to the baseline using feature correspondences."""

    def __init__(self, device: torch.device) -> None:
        self.device = device
        self.matcher = LoFTR(pretrained="outdoor").to(self.device).eval()

    def _prepare_tensor(self, image_bgr: np.ndarray) -> torch.Tensor:
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        normalized = gray.astype(np.float32) / 255.0
        tensor = torch.from_numpy(normalized)[None, None, ...]
        return tensor.to(self.device)

    def align(
        self,
        reference_bgr: np.ndarray,
        moving_bgr: np.ndarray,
    ) -> tuple[np.ndarray, dict[str, float]]:
        """Warp the moving image so it lines up with the reference frame."""
        tensor_ref = self._prepare_tensor(reference_bgr)
        tensor_mov = self._prepare_tensor(moving_bgr)

        with torch.no_grad():
            correspondences = self.matcher({"image0": tensor_ref, "image1": tensor_mov})

        keypoints0 = correspondences.get("keypoints0")
        keypoints1 = correspondences.get("keypoints1")
        if keypoints0 is None or keypoints1 is None:
            logger.warning("loftr_failed_no_keypoints")
            return moving_bgr, {"alignment_inliers": 0.0, "alignment_matches": 0.0}

        pts0 = keypoints0.cpu().numpy()
        pts1 = keypoints1.cpu().numpy()

        total_matches = float(len(pts0))
        if len(pts0) < 4:
            logger.warning("loftr_insufficient_matches", count=len(pts0))
            return moving_bgr, {"alignment_inliers": 0.0, "alignment_matches": total_matches}

        homography, inliers = cv2.findHomography(pts1, pts0, cv2.RANSAC, 4.0)
        if homography is None:
            logger.warning("loftr_homography_failed")
            return moving_bgr, {"alignment_inliers": 0.0, "alignment_matches": total_matches}

        aligned = cv2.warpPerspective(
            moving_bgr,
            homography,
            (reference_bgr.shape[1], reference_bgr.shape[0]),
            flags=cv2.INTER_LINEAR,
        )

        inlier_ratio = float(inliers.sum()) / float(len(inliers)) if inliers is not None else 0.0
        metrics = {
            "alignment_matches": total_matches,
            "alignment_inliers": float(inlier_ratio),
        }
        return aligned, metrics
