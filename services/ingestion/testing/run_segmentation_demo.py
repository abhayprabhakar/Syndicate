"""Segmentation demo that mirrors notebook steps 1-5 on sample test images."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4


INGESTION_ROOT = Path(__file__).resolve().parents[1]
if str(INGESTION_ROOT) not in sys.path:
    sys.path.insert(0, str(INGESTION_ROOT))

from services.segmentation import SegmentationPipeline, SegmentationJobSpec

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_BASELINE = REPO_ROOT / "test-images" / "f1-blah-1.jpg"
DEFAULT_CURRENT = REPO_ROOT / "test-images" / "f1-blah-2.jpg"


def parse_bbox(value: Optional[str]) -> Optional[tuple[int, int, int, int]]:
    if not value:
        return None
    parts = [int(chunk.strip()) for chunk in value.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("Bounding box must contain four integers: x0,y0,x1,y1")
    x0, y0, x1, y1 = parts
    if x0 >= x1 or y0 >= y1:
        raise argparse.ArgumentTypeError("Bounding box coordinates must satisfy x0<x1 and y0<y1")
    return x0, y0, x1, y1


def parse_request_id(value: Optional[str]) -> UUID:
    if value:
        return UUID(value)
    return uuid4()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Runs the SegmentationPipeline (Steps 1-5) on the default test-images or supplied files. "
            "Artifacts are written to the configured segmentation output directory. "
            "Use SEGMENTATION_ENABLE_CHANGE_DETECTION=true to enable Step 5 (change detection)."
        )
    )
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE, help="Path to baseline image")
    parser.add_argument("--current", type=Path, default=DEFAULT_CURRENT, help="Path to current image")
    parser.add_argument("--camera-id", default="SegmentationDemoCam", help="Camera identifier")
    parser.add_argument("--request-id", help="Optional request UUID to tag outputs")
    parser.add_argument(
        "--bbox",
        type=parse_bbox,
        help="Optional bounding box override formatted as x0,y0,x1,y1 (pixels)",
    )
    parser.add_argument(
        "--metadata",
        help="Optional JSON metadata string recorded alongside artifacts",
    )
    return parser.parse_args()


def load_metadata(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid metadata JSON: {exc}") from exc


def ensure_image(path: Path) -> Path:
    if not path.exists():
        raise SystemExit(f"Image not found: {path}")
    return path.resolve()


def main() -> int:
    args = parse_args()
    baseline_path = ensure_image(args.baseline)
    current_path = ensure_image(args.current)
    metadata = load_metadata(args.metadata)
    request_id = parse_request_id(args.request_id)

    pipeline = SegmentationPipeline()

    job = SegmentationJobSpec(
        baseline_path=baseline_path,
        current_path=current_path,
        camera_id=args.camera_id,
        request_id=request_id,
        bounding_box=args.bbox,
        metadata={
            "script": "run_segmentation_demo.py",
            "baseline": str(baseline_path),
            "current": str(current_path),
            **metadata,
        },
    )

    artifacts = pipeline.run(job)

    print("\nSegmentation pipeline completed. Key outputs:\n")
    
    result = {
        "request_id": str(request_id),
        "camera_id": args.camera_id,
        "metrics": artifacts.quality_metrics,
        "artifact_paths": {key: str(path) for key, path in artifacts.artifact_paths.items()},
    }
    
    # Add change detection results if available
    if artifacts.change_count > 0:
        result["change_detection"] = {
            "change_count": artifacts.change_count,
            "has_confidences": artifacts.change_confidences is not None,
            "has_areas": artifacts.change_areas is not None,
        }
        if artifacts.change_confidences is not None:
            result["change_detection"]["avg_confidence"] = float(artifacts.change_confidences.mean())
            result["change_detection"]["max_confidence"] = float(artifacts.change_confidences.max())
        if artifacts.change_areas is not None:
            result["change_detection"]["total_area_pixels"] = int(artifacts.change_areas.sum())
    
    print(json.dumps(result, indent=2))

    print("\nUse the metadata/artifact paths above to inspect aligned and normalized images.")
    if artifacts.change_count > 0:
        print(f"\n✨ Change Detection: {artifacts.change_count} changes detected!")
        print("   Check 'change_detection_viz.png' in the artifacts directory for visualizations.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
