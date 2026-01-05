const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const TOKENS_PATH = path.join(__dirname, 'final_tokens.json');

const TASKS_FOLDER_ID = '1EzdCa49QHIUc7udBqqobuwMHcggSVTn2';
const VIDEOS_FOLDER_ID = '17a65IWgfvipnjSfKu6YYssCJwwUOOgvL';
const FILES_FOLDER_ID = '14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_';
const DB_FOLDER_ID = '1AGAN36ErTOMF8-SwG2OxJXBQ9VySsVrc';
const AVATAR_FOLDER_ID = '1_7gJgXHupwKb3lN-nJ3uEzMHzNGni7DO';

let drive;
let oauth2Client;

try {
    let keys, tokens;

    // 1. Try Environment Variables
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_TOKENS) {
        console.log("Loading Credentials from Environment Variables...");
        keys = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET
        };
        tokens = JSON.parse(process.env.GOOGLE_TOKENS);
    }
    // 2. Fallback to Local Files
    else {
        console.log("Loading Credentials from Local Files...");
        if (fs.existsSync(CREDENTIALS_PATH)) {
            const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
            keys = creds.web || creds.installed;
        }
        if (fs.existsSync(TOKENS_PATH)) {
            tokens = JSON.parse(fs.readFileSync(TOKENS_PATH));
        }
    }

    if (!keys || !tokens) {
        throw new Error("Missing Credentials! Please check env vars or local files.");
    }

    // CONSISTENT REDIRECT URI
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000";

    oauth2Client = new google.auth.OAuth2(
        keys.client_id,
        keys.client_secret,
        redirectUri
    );
    oauth2Client.setCredentials(tokens);

    // TOKEN REFRESH PERSISTENCE
    oauth2Client.on('tokens', (newTokens) => {
        if (!newTokens) return;
        console.log("✅ Google tokens refreshed.");

        const updated = {
            ...oauth2Client.credentials,
            ...newTokens,
        };

        // Persist to local file (Dev)
        try {
            fs.writeFileSync(TOKENS_PATH, JSON.stringify(updated, null, 2));
            console.log("Tokens saved to local file.");
        } catch (e) {
            console.error("Failed to save tokens to file:", e.message);
        }

        // For Production (Railway logs)
        console.log("📢 Update Railway GOOGLE_TOKENS env var with this JSON:\n", JSON.stringify(updated));
    });

    drive = google.drive({ version: 'v3', auth: oauth2Client });
    console.log(`Drive Service Initialized with Redirect URI: ${redirectUri}`);

} catch (err) {
    console.error("Failed to initialize Drive with OAuth2:", err.message);
}

const uploadFile = async (fileObject, parentId) => {
    try {
        if (!drive) throw new Error("Google Drive Service not initialized");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);

        const fileMetadata = {
            name: fileObject.originalname,
            parents: [parentId],
        };

        const media = {
            mimeType: fileObject.mimetype,
            body: bufferStream,
        };

        const res = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        return res.data;
    } catch (err) {
        console.error("Error uploading to Drive:", err);
        throw err;
    }
};

const findFolder = async (folderName, parentId) => {
    try {
        if (!drive) return null;
        const query = `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed=false`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id)',
        });
        if (res.data.files.length > 0) {
            return res.data.files[0].id;
        }
        return null;
    } catch (err) {
        console.error("Error searching folder:", err);
        return null;
    }
};

const createFolder = async (folderName, parentId) => {
    try {
        if (!drive) throw new Error("Google Drive Service not initialized");
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return file.data.id;
    } catch (err) {
        console.error("[DriveService] Error creating folder:", err);
        throw err;
    }
};

const listFiles = async (folderId, type = 'video') => {
    try {
        if (!drive) {
            console.error("[DriveService] Drive not initialized");
            return [];
        }
        const mimeTypeQuery = type === 'video' ? "(mimeType contains 'video/' or mimeType = 'application/octet-stream')" : "(mimeType = 'application/pdf')";
        const query = `'${folderId}' in parents and ${mimeTypeQuery} and trashed=false`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name, webViewLink, webContentLink, thumbnailLink, size, modifiedTime)',
            orderBy: 'name',
        });
        return res.data.files || [];
    } catch (err) {
        console.error(`[DriveService] Error listing files for folder ${folderId}:`, err);
        return [];
    }
};

const listFolders = async (parentId) => {
    try {
        if (!drive) {
            console.error("Drive not initialized");
            return [];
        }
        const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            orderBy: 'name',
        });
        return res.data.files || [];
    } catch (err) {
        console.error(`Error listing folders for parent ${parentId}:`, err);
        return [];
    }
};

const isInitialized = () => !!drive;

const getLiveStatus = async () => {
    if (!drive) return "NOT_INITIALIZED";
    try {
        await drive.about.get({ fields: "user" });
        return "OK";
    } catch (err) {
        return err?.response?.data?.error || err.message || "ERROR";
    }
};

module.exports = {
    uploadFile,
    listFiles,
    listFolders,
    findFolder,
    createFolder,
    isInitialized,
    getLiveStatus,
    backupDatabase,
    restoreDatabase,
    uploadAvatar,
    VIDEOS_FOLDER_ID,
    FILES_FOLDER_ID,
    AVATAR_FOLDER_ID
};
