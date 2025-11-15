# 🔍 Frontend-Backend Integration Debug Guide

## ✅ What We Fixed

### **Problem Identified:**
1. Backend works individually (curl test passed for `/segment`)
2. Frontend wasn't handling different backend response formats
3. Missing console logging for debugging
4. No fallback strategies for image URL construction

### **Solution Implemented:**
1. ✅ Added comprehensive logging in `ImageComparisonPage.tsx`
2. ✅ Added 3 fallback strategies for image loading:
   - Strategy 1: Direct base64 from backend (`annotated_before_base64`, `annotated_after_base64`)
   - Strategy 2: Single combined image URL (`classified_changes_url`)
   - Strategy 3: Constructed URL from job_id (`/outputs/{job_id}_classified.png`)
3. ✅ Added proper error messages for each failure point
4. ✅ Added API_BASE_URL constant for URL construction

---

## 🧪 Step-by-Step Testing Guide

### **Step 1: Verify Backend is Running**

Open browser and test health endpoint:
```
https://giovanna-unpredatory-ronin.ngrok-free.dev/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "models": {
    "sam": true,
    "anychange": true,
    "clip": true
  },
  "gpu_available": true,
  "device": "cuda:0"
}
```

✅ **If this works, backend is ready!**

---

### **Step 2: Test Individual Endpoint (Segment)**

You already did this successfully! ✅

```cmd
curl -X POST "https://giovanna-unpredatory-ronin.ngrok-free.dev/segment" -F "image=@f1_2025_current.jpg"
```

**This confirms:** Backend endpoints are working properly.

---

### **Step 3: Test Full Pipeline Endpoint**

```cmd
curl -X POST "https://giovanna-unpredatory-ronin.ngrok-free.dev/pipeline" ^
  -F "baseline=@f1_2016_baseline.jpg" ^
  -F "current=@f1_2025_current.jpg"
```

**Expected Response:**
```json
{
  "job_id": "some-uuid-here",
  "status": "queued",
  "message": "Pipeline started..."
}
```

**Copy the `job_id` and check status:**
```cmd
curl -X GET "https://giovanna-unpredatory-ronin.ngrok-free.dev/results/{job_id}"
```

**Watch for status changes:**
- `"status": "queued"` → Processing hasn't started
- `"status": "processing"` → Pipeline running
- `"status": "complete"` → ✅ Done!
- `"status": "failed"` → ❌ Error (check error field)

---

### **Step 4: Check What the Backend Returns**

When status is `"complete"`, the response should contain:

```json
{
  "job_id": "uuid",
  "status": "complete",
  "progress": "Pipeline complete!",
  "results": {
    "job_id": "uuid",
    "num_changes": 137,
    "changes": [
      {
        "id": 0,
        "bbox": [x1, y1, x2, y2],
        "part": "Front Wing",
        "confidence": 0.123
      },
      ...
    ]
  }
}
```

**❓ Question: Does the response include image data?**

Check for one of these fields:
1. `results.annotated_before_base64` - Base64 string of before image
2. `results.annotated_after_base64` - Base64 string of after image
3. `results.classified_changes_url` - URL to combined image
4. None of the above → Frontend will try to construct URL

---

## 🔧 Frontend Debugging Checklist

### **Step 5: Test Frontend Upload**

1. **Start frontend:**
   ```cmd
   cd frontend2
   npm run dev
   ```

2. **Open browser DevTools** (F12)

3. **Go to Upload & Analyze page**

4. **Upload both images**

5. **Click "Continue to Preview"**

6. **Watch Console Tab** for these messages:

```javascript
// Expected console logs:
Starting polling for job: <job_id>
Progress update: Initializing...
Progress update: Step 1/4: Loading images...
Progress update: Step 2/4: Aligning images...
Progress update: Step 3/4: Normalizing...
Progress update: Step 4/4: Detecting changes...
Pipeline completed, data: { ... }
```

---

### **Step 6: Check Network Tab**

In DevTools → **Network** tab:

1. **Look for POST request to `/pipeline`:**
   - Method: `POST`
   - URL: `https://giovanna-unpredatory-ronin.ngrok-free.dev/pipeline`
   - Status: `200 OK`
   - Response: `{ "job_id": "..." }`

2. **Look for GET requests to `/results/{job_id}`:**
   - Should appear every 2 seconds
   - Watch `status` field change: `queued` → `processing` → `complete`

3. **Check Response tab** of final GET request:
   - Expand `results` object
   - **Write down what fields you see!**

---

## 🚨 Common Issues & Solutions

### **Issue 1: "No job ID found"**

**Symptoms:**
- Error toast immediately on Image Comparison page
- No polling happens

**Solution:**
1. Check if `sessionStorage` has `currentJobId`:
   ```javascript
   // In browser console:
   sessionStorage.getItem('currentJobId')
   ```
2. If null, go back to Upload page and try again
3. Check if navigation is working properly

---

### **Issue 2: "Failed to upload images"**

**Symptoms:**
- Error on Upload page after clicking Continue
- Network tab shows failed POST request

**Solutions:**
1. **Check ngrok tunnel is alive:**
   ```cmd
   curl https://giovanna-unpredatory-ronin.ngrok-free.dev/health
   ```
   If it fails, restart ngrok in Kubeflow notebook.

2. **Check CORS headers:**
   Look for error: `Access-Control-Allow-Origin`
   → Backend needs CORS middleware (should already be there)

3. **Check file size:**
   Files over 10MB might timeout
   → Resize images first

---

### **Issue 3: Polling never completes**

**Symptoms:**
- Loading spinner forever
- Console shows: `Progress update: ...` continuously
- Status stuck at `processing`

**Solutions:**
1. **Check backend logs** in Kubeflow notebook for errors
2. **Manually check status:**
   ```cmd
   curl https://giovanna-unpredatory-ronin.ngrok-free.dev/results/{job_id}
   ```
3. **Look for status: "failed"** with error message
4. **Check if backend crashed** (test `/health` endpoint)

---

### **Issue 4: "Processing complete but images not accessible"**

**Symptoms:**
- Status is `"complete"`
- `num_changes` is correct (e.g., 137)
- But images don't display

**Diagnosis:**

**Check console log:** "Pipeline completed, data: ..."
- Expand the data object
- Look for image fields

**3 Possible Causes:**

#### **Cause A: Backend doesn't return image data**

If response looks like this:
```json
{
  "status": "complete",
  "results": {
    "num_changes": 137,
    "changes": [...]
  }
}
```

**Missing:** Image URL or base64 data!

**Solution:** Backend needs to add one of:
1. `annotated_before_base64` and `annotated_after_base64` fields
2. `classified_changes_url` field pointing to image
3. Save image to a public URL path

---

#### **Cause B: Image URL is wrong**

Frontend tries: `https://giovanna-unpredatory-ronin.ngrok-free.dev/outputs/{job_id}_classified.png`

**Test manually:**
```cmd
curl -I "https://giovanna-unpredatory-ronin.ngrok-free.dev/outputs/{job_id}_classified.png"
```

If it returns `404 Not Found`, the image isn't being served.

**Solution:** Backend needs to:
1. Save image to accessible location
2. Add static file serving route:
   ```python
   from fastapi.staticfiles import StaticFiles
   app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
   ```

---

#### **Cause C: CORS blocks image loading**

**Check console for:**
```
Access to image at '...' from origin '...' has been blocked by CORS policy
```

**Solution:** Add CORS headers to image responses or serve via data URL.

---

## 🎯 Backend Checklist (What to Add in Notebook)

Based on your curl test success, your backend **mostly works**. But for frontend to display images, you need to add **ONE of these**:

### **Option 1: Return Base64 Images (Easiest)**

In your `run_full_pipeline` function (Cell 73), after classification:

```python
# After creating classified_changes.png, read and encode it
import base64

# Read the combined image
with open(f"{OUTPUT_DIR}/{job_id}_classified.png", "rb") as f:
    img_data = f.read()
    img_base64 = base64.b64encode(img_data).decode()

# Split into before/after and encode separately
# (or send full combined image and let frontend split)

# Update results
jobs_db[job_id]["results"] = {
    "job_id": job_id,
    "num_changes": len(change_regions_api),
    "changes": change_regions_api,
    "classified_changes_base64": img_base64  # ADD THIS!
}
```

---

### **Option 2: Serve Static Files**

In Cell 70 (FastAPI setup), add:

```python
from fastapi.staticfiles import StaticFiles

# After app = FastAPI(...)
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")
```

Then in `run_full_pipeline`:
```python
jobs_db[job_id]["results"] = {
    "job_id": job_id,
    "num_changes": len(change_regions_api),
    "changes": change_regions_api,
    "classified_changes_url": f"/outputs/{job_id}_classified.png"  # ADD THIS!
}
```

---

### **Option 3: Return Image Endpoint**

Add new endpoint:

```python
@app.get("/image/{job_id}")
async def get_image(job_id: str):
    image_path = OUTPUT_DIR / f"{job_id}_classified.png"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path)
```

Then in results:
```python
"classified_changes_url": f"/image/{job_id}"
```

---

## 📊 Complete Debug Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS IMAGES                                   │
│    - Upload f1_2016_baseline.jpg                         │
│    - Upload f1_2025_current.jpg                          │
│    - Click "Continue to Preview"                         │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 2. FRONTEND: UploadAnalyzePage.tsx                       │
│    - Calls uploadPipeline(beforeImage, afterImage)       │
│    - Receives: { job_id: "uuid", status: "queued" }      │
│    - Stores job_id in sessionStorage                     │
│    - Navigates to Image Comparison page                  │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 3. BACKEND: FastAPI /pipeline endpoint                   │
│    - Receives FormData with 2 files                      │
│    - Saves to disk                                       │
│    - Creates job entry in jobs_db                        │
│    - Starts background task: run_full_pipeline()         │
│    - Returns job_id immediately                          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 4. BACKEND BACKGROUND: run_full_pipeline()               │
│    - Step 1: Load images                                 │
│    - Step 2: SAM segmentation                            │
│    - Step 3: LoFTR alignment                             │
│    - Step 4: Photometric normalization                   │
│    - Step 5: AnyChange detection (137 regions)           │
│    - Step 6: CLIP classification                         │
│    - Saves classified_changes.png                        │
│    - Updates jobs_db[job_id]["status"] = "complete"      │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 5. FRONTEND: ImageComparisonPage.tsx                     │
│    - Retrieves job_id from sessionStorage                │
│    - Starts polling: GET /results/{job_id} every 2s      │
│    - Updates progress text from backend                  │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 6. BACKEND: GET /results/{job_id}                        │
│    - Returns current status from jobs_db                 │
│    - When complete, includes "results" object            │
│    - Should include image data or URL                    │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ 7. FRONTEND: Process Results                             │
│    ┌────────────────────────────────────────────────┐   │
│    │ Strategy 1: Base64 images in results          │   │
│    │  → Display directly                            │   │
│    └────────────────────────────────────────────────┘   │
│    ┌────────────────────────────────────────────────┐   │
│    │ Strategy 2: classified_changes_url provided    │   │
│    │  → Fetch, split into before/after             │   │
│    └────────────────────────────────────────────────┘   │
│    ┌────────────────────────────────────────────────┐   │
│    │ Strategy 3: Construct URL from job_id         │   │
│    │  → Try /outputs/{job_id}_classified.png       │   │
│    └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 🎬 Next Steps for You

### **1. Test Backend Response Format**

Run full pipeline via curl and check what's in the response:

```cmd
# Start pipeline
curl -X POST "https://giovanna-unpredatory-ronin.ngrok-free.dev/pipeline" ^
  -F "baseline=@f1_2016_baseline.jpg" ^
  -F "current=@f1_2025_current.jpg"

# Copy job_id, then wait 60 seconds, then check:
curl -X GET "https://giovanna-unpredatory-ronin.ngrok-free.dev/results/{JOB_ID_HERE}"
```

**Tell me:**
- ✅ What is the `status` field?
- ✅ Does `results` object exist?
- ✅ What fields are inside `results`?
- ✅ Is there any image data or URL?

---

### **2. Test Frontend**

```cmd
cd frontend2
npm run dev
```

Open browser → F12 DevTools → Upload images → Watch console

**Report:**
- ✅ What console logs appear?
- ✅ What's the final "Pipeline completed, data:" object?
- ✅ Any errors in console?

---

### **3. If Images Don't Display**

Add one of the **3 backend options** above to return image data.

**Recommend: Option 1 (Base64)** - Simplest and works immediately!

---

## 📞 Support

**If you see:**
- ✅ "Pipeline completed, data: ..." in console
- ✅ `num_changes: 137` in response
- ❌ But no images display

**Then:** Backend needs to return image data (use Option 1 above).

**If upload fails entirely:** Check backend logs in Kubeflow for Python errors.

---

**Let me know what you find! 🚀**
