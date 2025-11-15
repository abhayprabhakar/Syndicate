const selectors = {
  baseUrlInput: document.getElementById("apiBaseUrl"),
  saveBaseUrl: document.getElementById("saveBaseUrl"),
  baseUrlHint: document.getElementById("baseUrlHint"),
  healthBtn: document.getElementById("healthBtn"),
  healthResult: document.getElementById("healthResult"),
  rtspForm: document.getElementById("rtspForm"),
  rtspResult: document.getElementById("rtspResult"),
  uploadForm: document.getElementById("uploadForm"),
  uploadResult: document.getElementById("uploadResult"),
  statusForm: document.getElementById("statusForm"),
  statusResult: document.getElementById("statusResult"),
};

const STORAGE_KEY = "trackshift_ingestion_base_url";
const DEFAULT_BASE_URL = "http://localhost:8000";

let baseUrl = localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL;
selectors.baseUrlInput.value = baseUrl;
updateBaseHint();

selectors.saveBaseUrl.addEventListener("click", () => {
  baseUrl = selectors.baseUrlInput.value.trim() || DEFAULT_BASE_URL;
  localStorage.setItem(STORAGE_KEY, baseUrl);
  updateBaseHint("Base URL saved.");
});

selectors.healthBtn.addEventListener("click", async () => {
  selectors.healthResult.textContent = "Running...";
  const res = await safeRequest("/health");
  selectors.healthResult.textContent = stringifyResult(res);
});

selectors.rtspForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  selectors.rtspResult.textContent = "Submitting...";

  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  if (payload.capture_duration === "") delete payload.capture_duration;
  else payload.capture_duration = Number(payload.capture_duration);

  if (payload.fps === "") delete payload.fps;
  else payload.fps = Number(payload.fps);

  payload.source_type = "rtsp";

  const res = await safeRequest("/api/v1/ingest/rtsp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  selectors.rtspResult.textContent = stringifyResult(res);
});

selectors.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  selectors.uploadResult.textContent = "Uploading...";

  const formElement = event.currentTarget;
  const formData = new FormData(formElement);
  formData.append("source_type", "upload");

  const res = await safeRequest("/api/v1/ingest/upload", {
    method: "POST",
    body: formData,
  });

  selectors.uploadResult.textContent = stringifyResult(res);
});

selectors.statusForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  selectors.statusResult.textContent = "Fetching...";

  const requestId = new FormData(event.currentTarget).get("request_id");
  const res = await safeRequest(`/api/v1/ingest/status/${requestId}`);
  selectors.statusResult.textContent = stringifyResult(res);
});

function updateBaseHint(message) {
  const hint = message ? `${message} ` : "";
  selectors.baseUrlHint.textContent = `${hint}Current: ${baseUrl}`;
}

async function safeRequest(path, options = {}) {
  const url = new URL(path, ensureTrailingSlash(baseUrl)).toString();

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      parsed = text;
    }
    return {
      ok: response.ok,
      status: response.status,
      url,
      body: parsed,
    };
  } catch (error) {
    return { ok: false, status: "network", url, body: { error: error.message } };
  }
}

function stringifyResult(result) {
  return JSON.stringify(result, null, 2);
}

function ensureTrailingSlash(value) {
  if (!value.endsWith("/")) {
    return `${value}/`;
  }
  return value;
}
