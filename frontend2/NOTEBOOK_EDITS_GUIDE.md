# 📝 EXACT NOTEBOOK EDITS - Copy & Paste Guide

## 🎯 **Cell 60: Pipeline Endpoint** (`@app.post("/pipeline")`)

Find your pipeline function. You'll see this structure:

```python
async def run_pipeline():
    try:
        # Step 1: Save uploaded files
        jobs_db[job_id]["progress"] = "Step 1/9: Saving uploaded images..."
        baseline_path = API_UPLOAD_DIR / f"{job_id}_baseline.jpg"
        current_path = API_UPLOAD_DIR / f"{job_id}_current.jpg"
        save_upload_file(baseline, baseline_path)
        save_upload_file(current, current_path)
        
        # Step 2: Load images
        jobs_db[job_id]["progress"] = "Step 2/9: Loading images..."
        baseline_bgr_orig = cv2.imread(str(baseline_path))
        current_bgr_orig = cv2.imread(str(current_path))
        baseline_rgb = cv2.cvtColor(baseline_bgr_orig, cv2.COLOR_BGR2RGB)
        current_rgb = cv2.cvtColor(current_bgr_orig, cv2.COLOR_BGR2RGB)
        
        # ✅ ADD THIS CODE BLOCK HERE (RIGHT AFTER Step 2)
        # ================================================================
        # Save baseline original and current unaligned
        # ================================================================
        baseline_original_api = API_RESULTS_DIR / f"{job_id}_baseline_original.jpg"
        cv2.imwrite(str(baseline_original_api), baseline_bgr_orig)
        
        current_unaligned_api = API_RESULTS_DIR / f"{job_id}_current_unaligned.jpg"
        cv2.imwrite(str(current_unaligned_api), current_bgr_orig)
        # ================================================================
        
        # Step 3: LoFTR Alignment
        jobs_db[job_id]["progress"] = "Step 3/9: Preparing for LoFTR..."
        baseline_gray = cv2.cvtColor(baseline_bgr_orig, cv2.COLOR_BGR2GRAY)
        current_gray = cv2.cvtColor(current_bgr_orig, cv2.COLOR_BGR2GRAY)
        
        # ... (rest of LoFTR code)
        
        # Step 5: Warp current image
        if M_affine is not None:
            H = np.vstack([M_affine, [0, 0, 1]])
            aligned_current = cv2.warpPerspective(current_bgr_orig, H, (w_base, h_base))
        else:
            aligned_current = current_bgr_orig
        
        # ✅ ADD THIS CODE BLOCK HERE (RIGHT AFTER aligned_current is created)
        # ================================================================
        # Create and save alignment overlay
        # ================================================================
        overlay = np.zeros_like(baseline_bgr_orig)
        overlay[:, :, 2] = cv2.cvtColor(baseline_bgr_orig, cv2.COLOR_BGR2GRAY)  # Red
        overlay[:, :, 1] = cv2.cvtColor(aligned_current, cv2.COLOR_BGR2GRAY)   # Green
        
        alignment_overlay_api = API_RESULTS_DIR / f"{job_id}_alignment_overlay.jpg"
        cv2.imwrite(str(alignment_overlay_api), overlay)
        # ================================================================
        
        # Step 6: Photometric Normalization
        # ... (rest of pipeline)
```

---

## 📋 **Summary: TWO Code Blocks to Add**

### **Block 1:** After Step 2 (Load images)
```python
# Save baseline original and current unaligned
baseline_original_api = API_RESULTS_DIR / f"{job_id}_baseline_original.jpg"
cv2.imwrite(str(baseline_original_api), baseline_bgr_orig)

current_unaligned_api = API_RESULTS_DIR / f"{job_id}_current_unaligned.jpg"
cv2.imwrite(str(current_unaligned_api), current_bgr_orig)
```

### **Block 2:** After Step 5 (Warp image)
```python
# Create and save alignment overlay
overlay = np.zeros_like(baseline_bgr_orig)
overlay[:, :, 2] = cv2.cvtColor(baseline_bgr_orig, cv2.COLOR_BGR2GRAY)  # Red
overlay[:, :, 1] = cv2.cvtColor(aligned_current, cv2.COLOR_BGR2GRAY)   # Green

alignment_overlay_api = API_RESULTS_DIR / f"{job_id}_alignment_overlay.jpg"
cv2.imwrite(str(alignment_overlay_api), overlay)
```

---

## ✅ **After Adding Code**

1. **Run the cell** (Shift+Enter)
2. **Restart server** (run Cell 65)
3. **Test with frontend** - upload images
4. **Check console** for these messages:
   ```
   ✅ BASELINE image loaded! (ImageComparisonPage)
   ✅ CURRENT image loaded! (ImageComparisonPage)
   ✅ Baseline original loaded! (ResultsPage)
   ✅ Current unaligned loaded! (ResultsPage)
   ✅ Alignment overlay loaded! (ResultsPage)
   ```

---

## 🔍 **Verify Backend Files**

After pipeline runs, check the API_RESULTS_DIR folder. You should see:

```
{job_id}_baseline_original.jpg      ← NEW!
{job_id}_current_unaligned.jpg      ← NEW!
{job_id}_alignment_overlay.jpg      ← NEW!
{job_id}_baseline_annotated.png     ← Already exists
{job_id}_current_annotated.png      ← Already exists
{job_id}_combined.png               ← Already exists
{job_id}_results.json               ← Already exists
```

**7 files total** per job_id.

---

## 🧪 **Quick Test Command**

After pipeline completes, test with curl:

```bash
# Get job_id from console logs, then:
curl "https://giovanna-unpredatory-ronin.ngrok-free.dev/images/YOUR_JOB_ID_HERE/baseline_original" -H "ngrok-skip-browser-warning: true" --output test.jpg
```

If this downloads a valid JPG image, backend is working correctly!

---

**That's all you need to add! Just 2 small code blocks in the pipeline cell.** 🎉
