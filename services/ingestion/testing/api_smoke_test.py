"""Simple smoke tester for the ingestion service APIs."""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
import time
from contextlib import nullcontext
from pathlib import Path
from typing import Any, Sequence

import httpx
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TrackShift ingestion API smoke test")
    parser.add_argument(
        "--api-base",
        default="http://localhost:8000",
        help="Root URL of the ingestion API (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--camera-id",
        default="SmokeTestCam",
        help="Camera identifier used for ingestion requests",
    )
    parser.add_argument(
        "--image-count",
        type=int,
        default=2,
        help="Number of synthetic images to upload (default: 2)",
    )
    parser.add_argument(
        "--rtsp-url",
        help="Optional RTSP URL to exercise the RTSP ingestion endpoint",
    )
    parser.add_argument(
        "--capture-mode",
        default="single_frame",
        choices=["single_frame", "continuous", "event_driven"],
        help="Capture mode for RTSP ingestion",
    )
    parser.add_argument(
        "--capture-duration",
        type=int,
        default=5,
        help="Capture duration (seconds) for RTSP ingestion when applicable",
    )
    parser.add_argument(
        "--fps",
        type=float,
        default=1.0,
        help="FPS for RTSP ingestion (ignored when not provided)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="HTTP timeout in seconds",
    )
    parser.add_argument(
        "--artifact-dir",
        type=Path,
        help="Optional directory to persist generated test images (left empty when omitted)",
    )
    return parser.parse_args()


def normalize_base_url(url: str) -> str:
    return url.rstrip("/")


def log_step(title: str, payload: Any) -> None:
    print(f"\n== {title} ==")
    print(json.dumps(payload, indent=2, default=str))


def generate_images(destination: Path, count: int) -> list[Path]:
    destination.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for idx in range(count):
        img = Image.effect_noise((640, 360), 64).convert("RGB")
        img = img.point(lambda value: (value + (idx * 10)) % 255)
        file_path = destination / f"smoke_{idx}.jpg"
        img.save(file_path, format="JPEG", quality=90)
        paths.append(file_path)
    return paths


def run_health_check(client: httpx.Client, base_url: str) -> dict:
    response = client.get(f"{base_url}/health")
    response.raise_for_status()
    return response.json()


def run_upload(client: httpx.Client, base_url: str, camera_id: str, image_paths: Sequence[Path]) -> dict:
    files = []
    for path in image_paths:
        data = path.read_bytes()
        files.append(("files", (path.name, data, "image/jpeg")))
    data = {"camera_id": camera_id}
    response = client.post(f"{base_url}/api/v1/ingest/upload", data=data, files=files)
    response.raise_for_status()
    return response.json()


def run_status_check(client: httpx.Client, base_url: str, request_id: str) -> dict:
    response = client.get(f"{base_url}/api/v1/ingest/status/{request_id}")
    response.raise_for_status()
    return response.json()


def run_rtsp_ingestion(
    client: httpx.Client,
    base_url: str,
    camera_id: str,
    rtsp_url: str,
    capture_mode: str,
    duration: int,
    fps: float,
) -> dict:
    payload = {
        "source_type": "rtsp",
        "rtsp_url": rtsp_url,
        "camera_id": camera_id,
        "capture_mode": capture_mode,
    }
    if capture_mode != "single_frame":
        payload["capture_duration"] = duration
    if fps:
        payload["fps"] = fps
    response = client.post(f"{base_url}/api/v1/ingest/rtsp", json=payload)
    response.raise_for_status()
    return response.json()


def main() -> int:
    args = parse_args()
    base_url = normalize_base_url(args.api_base)

    try:
        artifact_context = (
            nullcontext(args.artifact_dir)
            if args.artifact_dir
            else tempfile.TemporaryDirectory()
        )

        with httpx.Client(timeout=args.timeout) as client, artifact_context as artifact_root:
            image_root = Path(artifact_root)
            if args.artifact_dir:
                image_root.mkdir(parents=True, exist_ok=True)
            # Health
            health = run_health_check(client, base_url)
            log_step("Health", health)

            # Upload generated images
            images = generate_images(image_root, args.image_count)
            upload_response = run_upload(client, base_url, args.camera_id, images)
            log_step("Upload", upload_response)

            request_id = upload_response.get("request_id")
            if request_id:
                time.sleep(1.0)
                status_payload = run_status_check(client, base_url, request_id)
                log_step("Status", status_payload)

            # Optional RTSP
            if args.rtsp_url:
                rtsp_payload = run_rtsp_ingestion(
                    client,
                    base_url,
                    args.camera_id,
                    args.rtsp_url,
                    args.capture_mode,
                    args.capture_duration,
                    args.fps,
                )
                log_step("RTSP", rtsp_payload)

        print("\nAll smoke tests completed successfully.")
        return 0
    except httpx.HTTPStatusError as exc:
        print(f"HTTP error: {exc.response.status_code} -> {exc.response.text}", file=sys.stderr)
        return 1
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
