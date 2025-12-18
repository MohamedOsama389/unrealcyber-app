const driveService = require('./server/driveService');

async function debugDrive() {
    console.log("--- DEBUGGING DRIVE SYNC ---");
    console.log("Video Folder ID:", driveService.VIDEOS_FOLDER_ID);

    try {
        console.log("\n1. Testing folder listing...");
        const folders = await driveService.listFolders(driveService.VIDEOS_FOLDER_ID);
        console.log(`Found ${folders.length} folders:`, JSON.stringify(folders, null, 2));

        console.log("\n2. Testing file listing (Video Mode)...");
        const videos = await driveService.listFiles(driveService.VIDEOS_FOLDER_ID, 'video');
        console.log(`Found ${videos.length} videos:`, JSON.stringify(videos, null, 2));

        console.log("\n3. Testing ALL files in folder (Broad Search)...");
        const res = await drive.files.list({
            q: `'${driveService.VIDEOS_FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
        });
        console.log(`Found ${res.data.files.length} items total:`, JSON.stringify(res.data.files, null, 2));

    } catch (err) {
        console.error("DEBUG FAILED:", err);
    }
}

// Minimal drive init for standalone run
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, 'client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const TOKENS_PATH = path.join(__dirname, 'server/final_tokens.json');

let drive;
if (fs.existsSync(CREDENTIALS_PATH) && fs.existsSync(TOKENS_PATH)) {
    const keys = JSON.parse(fs.readFileSync(CREDENTIALS_PATH)).web;
    const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH));
    const oauth2Client = new google.auth.OAuth2(keys.client_id, keys.client_secret, 'http://localhost:3000');
    oauth2Client.setCredentials(tokens);
    drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Patch the debug script to use the drive object
    global.drive = drive;
    debugDrive();
} else {
    console.error("Missing credentials for debug script.");
}
