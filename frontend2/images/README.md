# 📁 Downloaded Images Folder

## 🎯 Purpose

This folder is intended to store downloaded annotated images from the F1 Visual Change Detection pipeline.

## 📥 How Images Are Downloaded

When the pipeline completes processing:

1. **Baseline Image** (`baseline_annotated_{job_id}.png`)
   - 2016 F1 car with colored bounding boxes
   - Classifications from CLIP model
   - Automatically downloaded to your **Downloads folder**

2. **Current Image** (`current_annotated_{job_id}.png`)
   - 2025 F1 car with colored bounding boxes
   - Same classifications and styling
   - Automatically downloaded to your **Downloads folder**

## 🖼️ Display in Frontend

- Images are **displayed instantly** using blob URLs
- No delay waiting for file system operations
- Downloads happen in background automatically

## 📂 Where Are Images Saved?

Due to browser security restrictions, images are automatically saved to:

```
Windows: C:\Users\{YourUsername}\Downloads\
```

**File Names:**
- `baseline_annotated_{job_id}.png`
- `current_annotated_{job_id}.png`

Example:
```
C:\Users\Aditya B\Downloads\baseline_annotated_a9de7b8b-842b-41d2-a1ca-dbc01eea4a28.png
C:\Users\Aditya B\Downloads\current_annotated_a9de7b8b-842b-41d2-a1ca-dbc01eea4a28.png
```

## ⚡ Performance Optimization

**Why images display instantly:**
1. ✅ Fetch from backend (fast - ngrok tunnel)
2. ✅ Create blob URL immediately
3. ✅ Display in UI (no delay)
4. ✅ Save to Downloads in background

**Before (slow):**
- Wait for download → Save to disk → Read from disk → Display

**After (fast):**
- Fetch → Display immediately → Save in background

## 🔍 Finding Your Downloaded Images

1. Open **File Explorer**
2. Click **Downloads** in left sidebar
3. Sort by **Date modified** (newest first)
4. Look for files starting with `baseline_annotated_` or `current_annotated_`

## 📝 Notes

- Each pipeline run generates new images with unique job_id
- Images are downloaded automatically when processing completes
- No user interaction needed - happens in background
- Toast notification confirms: "Images saved to Downloads folder"

---

**Need to find specific images?**
Check your Downloads folder and search for the job_id shown in the browser console or success message.
