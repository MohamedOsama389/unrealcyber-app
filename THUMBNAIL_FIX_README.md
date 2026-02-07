# Lab Thumbnail Fix - Status & Next Steps

## Problem
Lab thumbnails show "NO IMAGE" on the production Railway deployment.

## What Has Been Done

### Backend Changes (Deployed to GitHub)
1. **Thumbnail Proxy Endpoint** - Added `/api/labs/thumbnail/:fileId` in `server/index.js` (line 1144-1167)
   - Streams images from Google Drive through the server
   - Bypasses browser CORS/403 restrictions

2. **Download Proxy Endpoint** - Added `/api/labs/download/:fileId` in `server/index.js` (line 1119-1142)
   - Available but not used (user requested direct Drive links)

### Frontend Changes (Deployed to GitHub)
1. **LabCard.tsx** - Updated thumbnail handling (line 19-50)
   - `getDriveId()` function extracts file ID from Google Drive URLs
   - Points to proxy endpoint: `/api/labs/thumbnail/${fileId}`
   - Has fallback to placeholder image on error

2. **vite.config.js** - Fixed proxy to point to port 8080 (was 3000)

## Critical Issue: Unknown Data Source

**The main blocker:** 
- Local database is EMPTY (0 labs)
- User sees labs on Railway production ("Cisco Packet Tracer", "Termux")
- Cannot determine the actual `thumbnail_link` format in production database

## What the Next Agent Needs to Do

### Step 1: Access Production Data
You MUST get the actual thumbnail_link value from the production database. Options:

**Option A - Direct Database Query (Best)**
```javascript
// On Railway production site, in browser console:
fetch('/api/labs', {
  headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}
})
.then(r => r.json())
.then(d => {
  console.log('Lab data:', d[0]);
  console.log('Thumbnail link:', d[0]?.thumbnail_link);
  console.log('File ID:', d[0]?.file_id);
})
```

**Option B - Check Railway Logs**
- Look for any console.log output from the server
- Check if `/api/labs` endpoint is being hit

**Option C - Railway Database Access**
- Use Railway's database viewer to see the `labs` table
- Check the `thumbnail_link` column values

### Step 2: Diagnose Based on Data

**If `thumbnail_link` is NULL:**
- User never uploaded thumbnails
- Solution: Re-upload labs with thumbnail images via admin panel

**If `thumbnail_link` is a Google Drive URL:**
- Check the format (e.g., `https://drive.google.com/file/d/ABC123/view`)
- Verify the regex in `LabCard.tsx` line 22-24 can extract the ID
- Test: Does the ID extraction work for that format?

**If `thumbnail_link` is already a file ID:**
- The proxy should work directly
- Check if proxy endpoint is accessible: `https://[railway-url]/api/labs/thumbnail/[file-id]`

### Step 3: Fix Based on Diagnosis

**If regex doesn't match the URL format:**
```typescript
// Update getDriveId() in client/src/components/labs/LabCard.tsx
const patterns = [
    /\/d\/(.*?)\//,           // /file/d/ID/view
    /id=(.*?)(&|$)/,          // ?id=ID&...
    /\/file\/d\/(.*?)\/view/, // /file/d/ID/view (explicit)
    // ADD MORE PATTERNS AS NEEDED
];
```

**If proxy endpoint returns 404:**
- Check if `driveService.getFileStream()` is working
- Verify Google Drive credentials are set in Railway environment

**If images still don't load:**
- Check browser Network tab for the actual error
- Look for CORS issues, 403 Forbidden, or 404 Not Found

## Files Modified (All Pushed to GitHub)
- `server/index.js` - Lines 1119-1167 (two new proxy endpoints)
- `client/src/components/labs/LabCard.tsx` - Lines 19-50 (thumbnail logic)
- `client/vite.config.js` - Line 10 (proxy port fix)
- `client/src/vite-env.d.ts` - Created (TypeScript support)

## Railway Deployment Status
- Latest commit: `2d01e13 - fix: update vite proxy to port 8080`
- **UNKNOWN if Railway has auto-deployed this yet**
- May need manual redeploy trigger

## Key Insight
The user is testing on **Railway production**, NOT localhost. All debugging must happen on the live site.

## Success Criteria
When fixed, lab cards should show thumbnail images instead of "NO IMAGE" placeholder.
