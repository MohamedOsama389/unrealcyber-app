# Railway Deployment Checklist

If you see a **blank screen** after deploying, check these settings in your Railway project:

## Required Settings

1. **Root Directory**  
   Leave **empty** or set to `.` (repo root).  
   Do **not** set it to `server` — the client must be built from the repo root.

2. **Build Command**  
   `npm run build`  
   (Builds the React client into `client/dist`.)

3. **Start Command**  
   `npm start`  
   (Runs `node server/index.js`.)

## Verify Build

- Check Railway **Deploy logs** for `✓ built in Xs` from the Vite build.
- If the build fails or is skipped, the app will show a blank screen.

## Quick Fix

If Root Directory was set to `server`, change it to empty and redeploy.
