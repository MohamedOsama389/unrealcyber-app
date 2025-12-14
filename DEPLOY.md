# Deployment Instructions

Your "Unreal Cyber Academy" is now a **Single Deployable Unit**.

## How to test "Production Mode" Locally
1. Run `npm run build` in `client/` (Already done).
2. Run `npm start` in `server/`.
3. Open `http://localhost:3000`. You will see the full app WITHOUT needing the `client` terminal running.

## How to Deploy Online (Render.com Example)
**Warning**: Because we use SQLite (`database.db`) and local JSON keys (`service-account.json`), standard container deployment will **wipe your data** on every restart unless you use a persistent disk.

### Option A: Railway.app (Recommended for SQLite)
1. Push your code to GitHub.
2. Create new Project on Railway from GitHub repo.
3. Add a **Volume** and mount it to `/app/server`.
4. Command: `npm start` (inside `/server`).

### Option B: Render.com (Simpler, but Ephemeral)
1. Push to GitHub.
2. Create "Web Service".
3. Root Directory: `server`.
4. Build Command: `npm install && cd ../client && npm install && npm run build`.
5. Start Command: `node index.js`.
6. **Important**: Your `database.db` and `service-account.json` are NOT in git (usually). You must:
   - Upload `database.db` to the disk (if using Disk).
   - Or just let it recreate a fresh empty DB on deploy.
   - For `service-account.json`, it's safer to convert the JSON content into an Environment Variable (e.g., `GOOGLE_CREDENTIALS_JSON`) and modify `driveService.js` to parse it.

## For NOW (Local Demo)
Your app is running in **Production Mode** on `http://localhost:3000`.
You can close the `client` terminal.
