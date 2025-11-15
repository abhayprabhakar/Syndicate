# Frontend Integration Testing Guide

## 🚀 Quick Start

### 1. Start the Frontend
```bash
cd frontend2
npm install  # if not already done
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### 2. Verify Backend is Running
Open browser and check:
```
https://giovanna-unpredatory-ronin.ngrok-free.dev/health
```

Should return:
```json
{
  "status": "healthy"
}
```

---

## 🧪 Test Scenario 1: Happy Path (Successful Upload & Processing)

### Steps:
1. **Navigate** to Upload & Analyze page (sidebar or direct URL)
2. **Select** "Manual Upload" option (click the card)
3. **Upload Before Image**:
   - Click on "Before Image" upload box
   - Select `f1_2016_baseline.jpg`
   - ✅ Green checkmark should appear
4. **Upload After Image**:
   - Click on "After Image" upload box
   - Select `f1_2025_current.jpg`
   - ✅ Green checkmark should appear
5. **Verify** green success message: "Both images uploaded successfully"
6. **Click** "Continue to Preview" button
7. **Observe** button changes to "Uploading & Processing..." with spinner
8. **Wait** 1-2 seconds for API call
9. **Verify** navigation to Image Comparison Preview page

### Expected Results on Image Comparison Page:
- **Before Image Panel**:
  - ✅ Spinner visible
  - ✅ Text: "Processing Images..."
  - ✅ Progress text updating (e.g., "Step 1/6: Loading images...")
- **After Image Panel**:
  - ✅ Same loading indicators
- **Wait 30-60 seconds** (depending on backend processing time)
- **Success State**:
  - ✅ Before image (left half of `classified_changes.png`) displays
  - ✅ After image (right half of `classified_changes.png`) displays
  - ✅ Bounding boxes visible on detected changes
  - ✅ F1 part labels visible
  - ✅ Status text: "Complete"
  - ✅ Success toast: "Images processed successfully!"

---

## 🧪 Test Scenario 2: Error Handling (No Backend)

### Steps:
1. **Stop the backend** or ngrok tunnel
2. Follow Test Scenario 1 steps 1-6
3. **Click** "Continue to Preview"

### Expected Results:
- ❌ Error toast: "Failed to upload images. Please try again."
- ❌ Button returns to normal state
- ❌ User stays on Upload page

---

## 🧪 Test Scenario 3: Missing Job ID (Direct Navigation)

### Steps:
1. **Clear sessionStorage** in browser DevTools:
   ```javascript
   sessionStorage.clear()
   ```
2. **Navigate directly** to Image Comparison page URL

### Expected Results:
- ❌ Error message: "No job ID found. Please upload images first."
- ❌ Error toast: "No job ID found"
- ❌ No loading indicators
- ❌ Both panels show error state

---

## 🧪 Test Scenario 4: Backend Processing Failure

### Steps:
1. **Simulate backend failure** (if possible, modify backend to return error)
2. Follow Test Scenario 1 steps 1-6
3. Wait for polling to receive `status: "failed"`

### Expected Results:
- ❌ Error icon displayed in both panels
- ❌ Error message visible
- ❌ Error toast: "Processing failed: [error message]"
- ❌ Status: "Error"

---

## 🔍 Debugging Checklist

### Browser DevTools Console
Open DevTools (F12) and check:
- ✅ No red error messages
- ✅ API calls visible in Network tab
- ✅ `POST /pipeline` returns 200 with `job_id`
- ✅ `GET /results/{job_id}` polling visible (every 2 seconds)
- ✅ sessionStorage contains `currentJobId`

### Network Tab Monitoring
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Watch for:
   - ✅ `POST /pipeline` → Status 200
   - ✅ `GET /results/{job_id}` → Status 200 (repeating)
   - ✅ Final response has `status: "complete"`
   - ✅ Response contains `classified_changes_url`

### sessionStorage Inspection
```javascript
// In browser console
sessionStorage.getItem('currentJobId')
// Should return: "uuid-string"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to upload images"
**Possible Causes**:
- Backend not running
- ngrok tunnel expired
- Network connectivity issues

**Solutions**:
1. Check backend health: `https://giovanna-unpredatory-ronin.ngrok-free.dev/health`
2. Restart ngrok if tunnel expired
3. Check browser console for CORS errors

---

### Issue 2: Infinite loading (images never appear)
**Possible Causes**:
- Backend stuck processing
- Polling not terminating
- Missing `classified_changes_url` in response

**Solutions**:
1. Check backend logs for errors
2. Verify backend returns `status: "complete"`
3. Ensure `classified_changes.png` file exists in `/home/jovyan/outputs/`
4. Check Network tab for polling responses

---

### Issue 3: Images appear but no bounding boxes
**Possible Causes**:
- CLIP classification failed
- Visualization not generated
- Wrong image URL

**Solutions**:
1. Check backend logs for CLIP errors
2. Verify `classified_changes.png` has annotations
3. Open image URL directly in browser to verify

---

### Issue 4: "No job ID found"
**Possible Causes**:
- sessionStorage cleared
- User navigated directly to page
- Upload step skipped

**Solutions**:
1. Always start from Upload page
2. Don't clear sessionStorage
3. Check sessionStorage for `currentJobId`

---

## 📊 Performance Expectations

### Upload Time
- **Expected**: 1-3 seconds
- **Includes**: File upload + pipeline start

### Processing Time
- **Expected**: 30-120 seconds
- **Depends on**: Image resolution, GPU availability, backend load
- **Progress updates**: Every 2 seconds

### Image Display
- **Expected**: Immediate after polling completes
- **Includes**: Image loading + canvas splitting

---

## ✅ Acceptance Criteria

**Feature is considered working if**:
- ✅ Images upload successfully
- ✅ Loading indicators appear
- ✅ Progress text updates
- ✅ Polling completes within 2 minutes
- ✅ Before/After images display with annotations
- ✅ No console errors
- ✅ Error states handle gracefully
- ✅ User can retry on failure

---

## 🎯 Test Matrix

| Scenario | Upload | API Call | Polling | Display | Pass/Fail |
|----------|--------|----------|---------|---------|-----------|
| Happy Path | ✅ | ✅ | ✅ | ✅ | ✅ PASS |
| No Backend | ✅ | ❌ | - | - | ✅ PASS (error handled) |
| Missing Job ID | - | - | - | ❌ | ✅ PASS (error shown) |
| Backend Failure | ✅ | ✅ | ✅ | ❌ | ✅ PASS (error handled) |

---

## 📝 Test Report Template

```markdown
## Test Report: [Date]

**Tester**: [Your Name]
**Environment**: 
- Frontend: http://localhost:5173
- Backend: https://giovanna-unpredatory-ronin.ngrok-free.dev

**Test Results**:

### Scenario 1: Happy Path
- Upload: ✅ PASS / ❌ FAIL
- API Call: ✅ PASS / ❌ FAIL
- Polling: ✅ PASS / ❌ FAIL
- Display: ✅ PASS / ❌ FAIL
- Notes: 

### Scenario 2: Error Handling
- Error Display: ✅ PASS / ❌ FAIL
- User Feedback: ✅ PASS / ❌ FAIL
- Notes:

**Issues Found**: 
1. [Issue description]
2. [Issue description]

**Screenshots**: [Attach if available]
```

---

## 🚀 Production Readiness

Before deploying to production:
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Backend health check passes
- [ ] Loading states work correctly
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable
- [ ] Images display correctly
- [ ] sessionStorage management works
- [ ] Browser compatibility tested (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness checked (if applicable)

---

**Happy Testing! 🎉**

For issues or questions, check:
- Backend logs in Jupyter notebook
- Browser console errors
- Network tab in DevTools
- `INTEGRATION_COMPLETE.md` for architecture details
