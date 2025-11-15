"""Typed contracts for the segmentation pipeline."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
from uuid import UUID

import numpy as np


@dataclass(slots=True)
class SegmentationJobSpec:
    """Inputs required to execute the segmentation workflow."""

    baseline_path: Path
    current_path: Path
    camera_id: str
    request_id: UUID
    bounding_box: Optional[tuple[int, int, int, int]] = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class SegmentationArtifacts:
    """Artifacts produced by the segmentation workflow."""

    baseline_image: np.ndarray
    current_image: np.ndarray
    mask: Optional[np.ndarray]
    aligned_current: np.ndarray
    normalized_baseline: np.ndarray
    normalized_current: np.ndarray
    artifact_paths: dict[str, Path] = field(default_factory=dict)
    quality_metrics: dict[str, float] = field(default_factory=dict)
    
    # Step 5: Change Detection outputs
    change_masks: Optional[Any] = None  # AnyChange mask container (RLE-encoded)
    change_count: int = 0
    change_confidences: Optional[np.ndarray] = None
    change_areas: Optional[np.ndarray] = None
