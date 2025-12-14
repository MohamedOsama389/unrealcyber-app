const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const TOKENS_PATH = path.join(__dirname, 'final_tokens.json');

const TASKS_FOLDER_ID = '1EzdCa49QHIUc7udBqqobuwMHcggSVTn2';
const VIDEOS_FOLDER_ID = '17a65IWgfvipnjSfKu6YYssCJwwUOOgvL';

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

const uploadFile = async (fileObject, studentName, taskTitle) => {
    try {
        console.log(`[Drive] Starting upload for ${studentName} - ${taskTitle}`);

        // 1. Find or Create Student Folder under TASKS_FOLDER_ID
        let studentFolderId = await findFolder(studentName, TASKS_FOLDER_ID);
        if (!studentFolderId) {
            console.log(`[Drive] Creating student folder '${studentName}'...`);
            studentFolderId = await createFolder(studentName, TASKS_FOLDER_ID);
            console.log(`[Drive] Student folder created: ${studentFolderId}`);
        } else {
            console.log(`[Drive] Found existing student folder: ${studentFolderId}`);
        }

        // 2. Find or Create Task Folder under StudentFolder
        let taskFolderId = await findFolder(taskTitle, studentFolderId);
        if (!taskFolderId) {
            console.log(`[Drive] Creating task folder '${taskTitle}'...`);
            taskFolderId = await createFolder(taskTitle, studentFolderId);
            console.log(`[Drive] Task folder created: ${taskFolderId}`);
        } else {
            console.log(`[Drive] Found existing task folder: ${taskFolderId}`);
        }

        // 3. Upload File
        console.log(`[Drive] Uploading file '${fileObject.originalname}' to folder ${taskFolderId}...`);
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);

        const { data } = await drive.files.create({
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: fileObject.originalname,
                parents: [taskFolderId],
            },
            fields: 'id, name, webViewLink, webContentLink',
        });
        console.log(`[Drive] Upload complete: ${data.id}`);

        return data;
    } catch (error) {
        console.error('Drive API Upload Error:', error);
        if (error.response) {
            console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.code === 403 || (error.response && error.response.status === 403)) {
            throw new Error("Google Drive Permission Denied. Please share the 'Unreal Cyber Academy' folder with the service account email.");
        }
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

const listVideos = async () => {
    try {
        // List video files from VIDEOS_FOLDER_ID
        // You can adjust mimeType query to allow other types or all files
        const query = `'${VIDEOS_FOLDER_ID}' in parents and (mimeType contains 'video/') and trashed=false`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name, webViewLink, webContentLink, thumbnailLink)',
            orderBy: 'createdTime desc',
        });
        return res.data.files;
    } catch (err) {
        console.error("Error listing videos:", err);
        return [];
    }
};

module.exports = {
    uploadFile,
    listVideos
};
