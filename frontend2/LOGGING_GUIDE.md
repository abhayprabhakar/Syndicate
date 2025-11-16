# 🔍 Logging Guide - F1 Visual Change Detection

## 📋 Complete Console Log Reference

### 🚀 Upload Phase (UploadAnalyzePage)

When you upload images, you'll see:

```
📤 Uploading images to pipeline...
📁 Before image: f1_2016_baseline.jpg 1234567 bytes
📁 After image: f1_2025_current.jpg 2345678 bytes
✅ Upload successful!
🆔 JOB ID: a9de7b8b-842b-41d2-a1ca-dbc01eea4a28
📝 Server response: {job_id: "...", status: "queued", message: "..."}
💾 Job ID saved to sessionStorage: a9de7b8b-842b-41d2-a1ca-dbc01eea4a28
🔄 Navigating to image-comparison page...
```

**IMPORTANT**: Copy the **JOB ID** from this log! You'll need it to check backend files.

---

### 🔄 Processing Phase (ImageComparisonPage)

#### Initial Load
```
🚀 IMAGE COMPARISON PAGE LOADED
📋 Job ID from sessionStorage: a9de7b8b-842b-41d2-a1ca-dbc01eea4a28
🔗 Backend URL: https://giovanna-unpredatory-ronin.ngrok-free.dev
🔄 Starting polling for job_id: a9de7b8b-842b-41d2-a1ca-dbc01eea4a28
```

#### Polling Updates (every 2 seconds)
```
📊 Poll response - Status: processing, Progress: Step 1/9: Loading images...
📈 Progress update: Step 1/9: Loading images...

📊 Poll response - Status: processing, Progress: Step 2/9: Preparing for LoFTR matching...
📈 Progress update: Step 2/9: Preparing for LoFTR matching...

📊 Poll response - Status: processing, Progress: Step 3/9: Running LoFTR feature matching...
📈 Progress update: Step 3/9: Running LoFTR feature matching...

📊 Poll response - Status: processing, Progress: Step 4/9: Computing affine transformation...
📈 Progress update: Step 4/9: Computing affine transformation...

📊 Poll response - Status: processing, Progress: Step 5/9: Warping current image to baseline...
📈 Progress update: Step 5/9: Warping current image to baseline...

📊 Poll response - Status: processing, Progress: Step 6/9: Photometric normalization...
📈 Progress update: Step 6/9: Photometric normalization...

📊 Poll response - Status: processing, Progress: Step 7/9: Detecting changes with AnyChange...
📈 Progress update: Step 7/9: Detecting changes with AnyChange...

📊 Poll response - Status: processing, Progress: Step 8/9: Classifying regions with CLIP...
📈 Progress update: Step 8/9: Classifying regions with CLIP...

📊 Poll response - Status: processing, Progress: Step 9/9: Creating visualization...
📈 Progress update: Step 9/9: Creating visualization...
```

#### Pipeline Complete
```
📊 Poll response - Status: completed, Progress: Pipeline completed successfully
✅ Pipeline COMPLETED for job_id: a9de7b8b-842b-41d2-a1ca-dbc01eea4a28
📦 Results: {job_id: "...", num_changes: 63, classified_changes_url: "..."}
🖼️ Image URLs: {baseline: "/images/.../baseline", current: "/images/.../current", combined: "/images/.../combined"}
🎉 PIPELINE COMPLETED!
📦 Full response data: {...}
✅ Status confirmed as completed
📊 Results object: {...}
🔢 Number of changes: 63
🖼️ Image URLs object: {...}
```

#### Image Download Phase
```
🖼️ Starting image fetch process...
📥 Fetching BASELINE image from: https://giovanna-unpredatory-ronin.ngrok-free.dev/images/a9de7b8b-.../baseline
✅ BASELINE image loaded successfully!
🎨 Baseline blob URL: blob:http://localhost:5173/12345678-1234-1234-1234-123456789abc
📦 Baseline blob size: 2219847 bytes
💾 Baseline image saved to: C:\Users\Aditya B\Downloads\baseline_annotated_a9de7b8b-842b-41d2-a1ca-dbc01eea4a28.png

📥 Fetching CURRENT image from: https://giovanna-unpredatory-ronin.ngrok-free.dev/images/a9de7b8b-.../current
✅ CURRENT image loaded successfully!
🎨 Current blob URL: blob:http://localhost:5173/87654321-4321-4321-4321-cba987654321
📦 Current blob size: 2156432 bytes
💾 Current image saved to: C:\Users\Aditya B\Downloads\current_annotated_a9de7b8b-842b-41d2-a1ca-dbc01eea4a28.png

🎊 ALL IMAGES LOADED AND DISPLAYED!
🖼️ Before image state: SET
🖼️ After image state: SET
```

---

## 🔍 How to Debug

### 1️⃣ Open Browser Console
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`
- Click the **Console** tab

### 2️⃣ Check for Errors
Look for red error messages like:
```
❌ No job_id found in sessionStorage
❌ Pipeline FAILED for job_id: ...
⚠️ Polling error for job_id: ...
```

### 3️⃣ Verify Job ID
After upload, you should see:
```
🆔 JOB ID: <YOUR_JOB_ID_HERE>
```
**Copy this ID!** You'll use it to find backend files.

### 4️⃣ Check Backend Files

On your Kubeflow server, the annotated images are saved to:
```
/path/to/API_RESULTS_DIR/{job_id}_baseline_annotated.png
/path/to/API_RESULTS_DIR/{job_id}_current_annotated.png
/path/to/API_RESULTS_DIR/{job_id}_combined.png
```

Example with real job_id:
```
/home/jupyter/api_results/a9de7b8b-842b-41d2-a1ca-dbc01eea4a28_baseline_annotated.png
/home/jupyter/api_results/a9de7b8b-842b-41d2-a1ca-dbc01eea4a28_current_annotated.png
/home/jupyter/api_results/a9de7b8b-842b-41d2-a1ca-dbc01eea4a28_combined.png
```

### 5️⃣ Manually Test Backend

Using curl (replace `{job_id}` with your actual ID):

```bash
# Get results JSON
curl "https://giovanna-unpredatory-ronin.ngrok-free.dev/results/{job_id}" \
  -H "ngrok-skip-browser-warning: true"

# Download baseline image
curl "https://giovanna-unpredatory-ronin.ngrok-free.dev/images/{job_id}/baseline" \
  -H "ngrok-skip-browser-warning: true" \
  --output baseline_test.png

# Download current image
curl "https://giovanna-unpredatory-ronin.ngrok-free.dev/images/{job_id}/current" \
  -H "ngrok-skip-browser-warning: true" \
  --output current_test.png
```

---

## 📂 File Locations

### Frontend Downloaded Files (Windows)
```
C:\Users\Aditya B\Downloads\baseline_annotated_{job_id}.png
C:\Users\Aditya B\Downloads\current_annotated_{job_id}.png
```

### Backend Saved Files (Kubeflow Server)
```
{API_RESULTS_DIR}/{job_id}_baseline_annotated.png
{API_RESULTS_DIR}/{job_id}_current_annotated.png
{API_RESULTS_DIR}/{job_id}_combined.png
```

---

## 🐛 Common Issues

### ❌ "No job ID found"
**Cause**: sessionStorage cleared or navigation happened too fast  
**Solution**: Check upload logs for the job_id, paste it manually if needed

### 🔄 Infinite Loading Spinner
**Cause**: Polling not detecting "completed" status  
**Fix**: Updated to check both `status === 'complete'` and `status === 'completed'`

### 🖼️ Images Not Displaying
**Causes**:
1. Backend files not generated (check Kubeflow logs)
2. ngrok tunnel expired (restart ngrok)
3. CORS or network error (check browser Network tab)

**Solution**: Check console for:
```
✅ BASELINE image loaded successfully!
✅ CURRENT image loaded successfully!
```

### 💾 Files Not Downloading
**Cause**: Browser blocked automatic downloads  
**Solution**: Check browser settings → Allow downloads from localhost

---

## 📊 Expected Timeline

| Phase | Duration | Status Updates |
|-------|----------|----------------|
| Upload | ~2s | Uploading... → Success |
| Queue | ~1s | Job queued |
| Step 1-2 | ~5s | Loading images, Preparing LoFTR |
| Step 3-5 | ~10s | LoFTR matching, Transformation, Warping |
| Step 6 | ~3s | Photometric normalization |
| Step 7 | ~15s | AnyChange detection |
| Step 8 | ~20s | CLIP classification (63 regions) |
| Step 9 | ~5s | Creating visualizations |
| Download | ~3s | Fetching and saving images |
| **Total** | **~60s** | Complete pipeline |

---

## ✅ Success Indicators

You should see ALL of these in order:

1. ✅ `🆔 JOB ID: <id>` (Upload successful)
2. ✅ `💾 Job ID saved to sessionStorage` (Stored correctly)
3. ✅ `🔄 Starting polling for job_id` (Polling started)
4. ✅ `📈 Progress update: Step X/9` (Pipeline running)
5. ✅ `✅ Pipeline COMPLETED` (Processing done)
6. ✅ `✅ BASELINE image loaded successfully!` (Image 1 ready)
7. ✅ `✅ CURRENT image loaded successfully!` (Image 2 ready)
8. ✅ `🎊 ALL IMAGES LOADED AND DISPLAYED!` (Everything done!)

---

## 🔧 Quick Debug Commands

**Check sessionStorage in browser console:**
```javascript
console.log(sessionStorage.getItem("currentJobId"));
```

**Force reload with specific job_id:**
```javascript
sessionStorage.setItem("currentJobId", "YOUR_JOB_ID_HERE");
window.location.reload();
```

**Clear sessionStorage and restart:**
```javascript
sessionStorage.clear();
// Then re-upload images
```

---

## 📞 Getting Help

If issues persist:

1. **Copy all console logs** (right-click in console → "Save as...")
2. **Note the job_id** from upload phase
3. **Check backend Kubeflow logs** for that job_id
4. **Test with curl** to verify backend is working
5. **Check Downloads folder** for any partially downloaded files

**Most common fix**: Refresh the page and re-upload images!
