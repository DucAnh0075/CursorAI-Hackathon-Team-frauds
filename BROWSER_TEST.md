# Browser Test Guide

## ⚠️ IMPORTANT: Environment Variable Setup

Your `.env` file needs to use `VITE_` prefix for browser access:

**Current (won't work in browser):**
```
MANUS_API_KEY=sk-...
```

**Required (for Vite):**
```
VITE_MANUS_API_KEY=sk-...
```

**After updating `.env`:**
1. Restart the dev server (stop with Ctrl+C, then `npm run dev`)
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## 🧪 Testing Steps

### 1. Open Browser
Navigate to: **http://localhost:3000**

### 2. Open Developer Tools
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Or `Cmd+Option+I` (Mac)

### 3. Check Console Tab

#### A. Check for Errors
Look for any red error messages. Common issues:

**"No API key configured"**
- ✅ Fix: Update `.env` to use `VITE_MANUS_API_KEY` instead of `MANUS_API_KEY`
- ✅ Restart dev server

**CORS errors**
- ⚠️ Some APIs block browser requests
- May need backend proxy for production

**"Failed to fetch"**
- Check Network tab for API call details
- Verify API endpoint is correct

#### B. Test API Configuration
In the browser console, type:
```javascript
testAPI()
```

This will:
- Check if API keys are loaded
- Test a simple API call
- Show any errors

### 4. Test UI Components

#### Text Input Test
1. Type a question: `"Solve: x^2 + 5x + 6 = 0"`
2. Click "Generate Video"
3. Watch for:
   - Loading spinner appears
   - No console errors
   - Slides appear after ~5-10 seconds

#### File Upload Test
1. Drag a PDF or image file
2. Check:
   - File is accepted
   - File name appears
   - No upload errors

### 5. Check Network Tab

1. Open Network tab in DevTools
2. Generate a video
3. Look for API calls:
   - Should see POST request to API endpoint
   - Check status code:
     - `200` = Success ✅
     - `401` = Authentication error (check API key)
     - `404` = Wrong endpoint
     - `CORS error` = API blocks browser requests

### 6. Expected Console Output

When app loads, you should see:
```
💡 Tip: Run testAPI() in console to test API configuration
```

No red errors should appear.

## 🔍 Debugging Commands

### Check Environment Variables
```javascript
console.log(import.meta.env.VITE_MANUS_API_KEY)
// Should show your key (if set correctly)
```

### Check All Env Vars
```javascript
console.log(import.meta.env)
```

### Test API Manually
```javascript
// In console:
testAPI()
```

## ✅ Success Indicators

- ✅ App loads without errors
- ✅ UI renders correctly
- ✅ No red errors in console
- ✅ API key is detected (check with `testAPI()`)
- ✅ Video generation works
- ✅ Slides appear and navigate correctly

## ❌ Common Issues

### Issue: API key not found
**Symptom:** "No API key configured" error
**Solution:** 
1. Rename `MANUS_API_KEY` to `VITE_MANUS_API_KEY` in `.env`
2. Restart dev server
3. Hard refresh browser

### Issue: CORS error
**Symptom:** "Access to fetch blocked by CORS policy"
**Solution:** 
- API may not support browser requests
- Need backend proxy for production
- For testing, check if API has CORS settings

### Issue: 401 Unauthorized
**Symptom:** API returns 401 status
**Solution:**
- Check API key is correct
- Verify key format
- Check API documentation for auth requirements

### Issue: Wrong endpoint
**Symptom:** 404 Not Found
**Solution:**
- Check Manus API documentation
- Update endpoint in `src/services/api.ts` if needed

## 📝 Test Checklist

- [ ] App loads at http://localhost:3000
- [ ] No console errors on page load
- [ ] Environment variables accessible (test with `testAPI()`)
- [ ] Text input works
- [ ] File upload works
- [ ] Video generation triggers API call
- [ ] API call succeeds (check Network tab)
- [ ] Slides appear after generation
- [ ] Navigation buttons work
- [ ] No runtime errors

## 🚀 Next Steps After Testing

1. If API works: Continue development
2. If CORS issues: Set up backend proxy
3. If API key issues: Fix `.env` and restart
4. If other errors: Check specific error messages
