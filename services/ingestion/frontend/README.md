# TrackShift Ingestion Tester Frontend

A minimal static UI that exercises the ingestion service APIs:

- `GET /health`
- `POST /api/v1/ingest/rtsp`
- `POST /api/v1/ingest/upload`
- `GET /api/v1/ingest/status/{request_id}`

## Usage

1. Ensure the FastAPI ingestion service is running locally (defaults to `http://localhost:8000`).
2. Serve this directory with any static file server. Example:

```bash
cd services/ingestion/frontend
python -m http.server 5173
```

3. Open the printed URL (e.g., <http://localhost:5173>) in a browser.
4. Set the API base URL at the top of the page if it differs from the default.
5. Use the provided forms/buttons to call each endpoint.

## Notes

- All results are printed as JSON blobs so you can copy/paste them into bug reports.
- The upload form accepts multiple images; ensure file sizes meet the ingestion service limits.
- The RTSP form keeps optional fields blank if you do not provide them.
- Request IDs returned from either ingestion flow can be pasted into the status form to poll progress.
