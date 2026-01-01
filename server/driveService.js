const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const TOKENS_PATH = path.join(__dirname, 'final_tokens.json');

const TASKS_FOLDER_ID = '1EzdCa49QHIUc7udBqqobuwMHcggSVTn2';
const VIDEOS_FOLDER_ID = '17a65IWgfvipnjSfKu6YYssCJwwUOOgvL';
const FILES_FOLDER_ID = '14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_';

let drive;

try {
    let keys, tokens;

    // 1. Try Environment Variables (Production / Render)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_TOKENS) {
        console.log("Loading Credentials from Environment Variables...");
        keys = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET
        };
        tokens = JSON.parse(process.env.GOOGLE_TOKENS);
    }
    // 2. Fallback to Local Files (Development)
    else {
        console.log("Loading Credentials from Local Files...");
        if (fs.existsSync(CREDENTIALS_PATH)) {
            keys = JSON.parse(fs.readFileSync(CREDENTIALS_PATH)).web;
        }
        if (fs.existsSync(TOKENS_PATH)) {
            tokens = JSON.parse(fs.readFileSync(TOKENS_PATH));
        }
    }

    if (!keys || !tokens) {
        throw new Error("Missing Credentials! Please check env vars or local files.");
    }

    const redirectUri = process.env.NODE_ENV === 'production'
        ? (process.env.RENDER_EXTERNAL_URL || 'https://unrealcyber-app.onrender.com')
        : 'http://localhost:3000';

    const oauth2Client = new google.auth.OAuth2(
        keys.client_id,
        keys.client_secret,
        redirectUri
    );
    oauth2Client.setCredentials(tokens);

    drive = google.drive({ version: 'v3', auth: oauth2Client });
    console.log("Drive Service Initialized with OAuth2");

} catch (err) {
    console.error("Failed to initialize Drive with OAuth2:", err);
    console.error("Uploads will fail until this is fixed.");
}

// IDs loaded above

const uploadFile = async (fileObject, parentId, fileName = null) => {
    try {
        console.log(`[Drive] Starting upload to folder ${parentId}`);

        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);

        const { data } = await drive.files.create({
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: fileName || fileObject.originalname,
                parents: [parentId],
            },
            fields: 'id, name, webViewLink, webContentLink',
        });
        console.log(`[Drive] Upload complete: ${data.id}`);

        return data;
    } catch (error) {
        console.error('Drive API Upload Error:', error);
        throw error;
    }
};

const findFolder = async (folderName, parentId) => {
    try {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
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
        console.error("Error creating folder:", err);
        throw err;
    }
};

const listFiles = async (folderId, type = 'video') => {
    try {
        const mimeTypeQuery = type === 'video' ? "(mimeType contains 'video/' or mimeType = 'application/octet-stream')" : "(mimeType = 'application/pdf')";
        const query = `'${folderId}' in parents and ${mimeTypeQuery} and trashed=false`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name, webViewLink, webContentLink, thumbnailLink, size, modifiedTime)',
            orderBy: 'name',
        });
        return res.data.files || [];
    } catch (err) {
        console.error(`Error listing files for folder ${folderId}:`, err);
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

module.exports = {
    uploadFile,
    listFiles,
    listFolders,
    VIDEOS_FOLDER_ID,
    FILES_FOLDER_ID
};
