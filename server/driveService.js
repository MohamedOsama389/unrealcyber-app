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
const PARTY_FOLDER_ID = '1j6Ne5b-NC6Tl5sw-9s0K09N8AoT5jhra';

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

const backupDatabase = async () => {
    try {
        if (!drive) return;
        const DB_PATH = path.join(__dirname, '../database.db');
        if (!fs.existsSync(DB_PATH)) return;

        console.log("[DriveService] Starting database backup...");

        const fileMetadata = {
            name: `database_backup_${new Date().toISOString().split('T')[0]}.db`,
            parents: [DB_FOLDER_ID],
        };
        const media = {
            mimeType: 'application/x-sqlite3',
            body: fs.createReadStream(DB_PATH),
        };

        const res = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log("[DriveService] Database backup successful:", res.data.id);
        return res.data.id;
    } catch (err) {
        console.error("[DriveService] Database backup failed:", err.message);
    }
};

const restoreDatabase = async () => {
    try {
        if (!drive) {
            console.warn("[DriveService] Drive not initialized, cannot restore. Falling back to local DB.");
            return;
        }
        const DB_PATH = path.join(__dirname, '../database.db');

        console.log("[DriveService] Checking for latest database backup in Drive...");
        const res = await drive.files.list({
            q: `'${DB_FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name, modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: 1
        });

        if (res.data.files.length === 0) {
            console.log("[DriveService] No backups found on Drive. Using local database.");
            return;
        }

        const latestFile = res.data.files[0];
        console.log(`[DriveService] Latest Drive backup detected: ${latestFile.name} (Modified: ${latestFile.modifiedTime})`);

        // If local file exists, we could compare timestamps, but for "Auto-Restore" on deploy, 
        // we usually want the Drive version as the source of truth if it's available.
        console.log(`[DriveService] Synchronizing local database with ${latestFile.name}...`);

        const dest = fs.createWriteStream(DB_PATH);
        const response = await drive.files.get(
            { fileId: latestFile.id, alt: 'media' },
            { responseType: 'stream' }
        );

        return new Promise((resolve, reject) => {
            response.data
                .on('end', () => {
                    console.log("[DriveService] Database synchronization complete.");
                    resolve();
                })
                .on('error', err => {
                    console.error("[DriveService] Error downloading database:", err);
                    reject(err);
                })
                .pipe(dest);
        });
    } catch (err) {
        console.error("[DriveService] Database restore/sync failed:", err.message);
        console.warn("[DriveService] Falling back to local database status.");
    }
};

const uploadManualMaster = async () => {
    try {
        if (!drive) return;
        const DB_PATH = path.join(__dirname, '../database.db');
        if (!fs.existsSync(DB_PATH)) return;

        console.log("[DriveService] Syncing Manual Master to Drive...");

        // Find existing manual master if any
        const resList = await drive.files.list({
            q: `'${DB_FOLDER_ID}' in parents and name = 'manual_master_database.db' and trashed=false`,
            fields: 'files(id)'
        });

        const fileMetadata = {
            name: 'manual_master_database.db',
            parents: [DB_FOLDER_ID],
        };
        const media = {
            mimeType: 'application/x-sqlite3',
            body: fs.createReadStream(DB_PATH),
        };

        if (resList.data.files.length > 0) {
            const fileId = resList.data.files[0].id;
            await drive.files.update({
                fileId: fileId,
                media: media
            });
            console.log("[DriveService] Manual Master updated:", fileId);
        } else {
            const resCreate = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log("[DriveService] Manual Master created:", resCreate.data.id);
        }
    } catch (err) {
        console.error("[DriveService] Manual Master upload failed:", err.message);
    }
};

const restoreManualMaster = async () => {
    try {
        if (!drive) return;
        const DB_PATH = path.join(__dirname, '../database.db');

        console.log("[DriveService] Checking for Manual Master in Drive...");
        const res = await drive.files.list({
            q: `'${DB_FOLDER_ID}' in parents and name = 'manual_master_database.db' and trashed=false`,
            fields: 'files(id, name)',
            pageSize: 1
        });

        if (res.data.files.length === 0) {
            console.log("[DriveService] No Manual Master found on Drive.");
            return false;
        }

        const masterFile = res.data.files[0];
        console.log(`[DriveService] Manual Master detected: ${masterFile.name}`);
        console.log(`[DriveService] Restoring Manual Master...`);

        const dest = fs.createWriteStream(DB_PATH);
        const response = await drive.files.get(
            { fileId: masterFile.id, alt: 'media' },
            { responseType: 'stream' }
        );

        return new Promise((resolve) => {
            let errorOccurred = false;

            dest.on('finish', () => {
                if (!errorOccurred) {
                    console.log("[DriveService] Manual Master restoration complete (File Flushed).");
                    resolve(true);
                }
            });

            dest.on('error', (err) => {
                console.error("[DriveService] Error writing master file:", err);
                errorOccurred = true;
                resolve(false);
            });

            response.data
                .on('error', err => {
                    console.error("[DriveService] Error downloading master:", err);
                    errorOccurred = true;
                    resolve(false);
                })
                .pipe(dest);
        });
    } catch (err) {
        console.error("[DriveService] Manual Master restore failed:", err.message);
        return false;
    }
};

const uploadAvatar = async (fileBuffer, fileName, mimeType) => {
    try {
        if (!drive) throw new Error("Drive not initialized");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        const res = await drive.files.create({
            resource: {
                name: `avatar_${Date.now()}_${fileName}`,
                parents: [AVATAR_FOLDER_ID],
            },
            media: {
                mimeType: mimeType,
                body: bufferStream,
            },
            fields: 'id',
        });

        const avatarId = res.data.id;
        await drive.permissions.create({
            fileId: avatarId,
            requestBody: { role: 'reader', type: 'anyone' },
        });
        return avatarId;
    } catch (err) {
        console.error("[DriveService] Avatar upload failed:", err);
        throw err;
    }
};

const uploadPartyVideo = async (fileBuffer, fileName, mimeType) => {
    try {
        if (!drive) throw new Error("Drive not initialized");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);

        const res = await drive.files.create({
            resource: {
                name: `party_${Date.now()}_${fileName}`,
                parents: [PARTY_FOLDER_ID],
            },
            media: {
                mimeType: mimeType,
                body: bufferStream,
            },
            fields: 'id',
        });

        const videoId = res.data.id;
        await drive.permissions.create({
            fileId: videoId,
            requestBody: { role: 'reader', type: 'anyone' },
        });
        return videoId;
    } catch (err) {
        console.error("[DriveService] Party video upload failed:", err);
        throw err;
    }
};

const getFileStream = async (fileId, range = null) => {
    try {
        if (!drive) throw new Error("Google Drive Service not initialized");

        const params = { fileId, alt: 'media' };
        const options = { responseType: 'stream' };

        if (range) {
            options.headers = { Range: range };
        }

        const response = await drive.files.get(params, options);
        return response;
    } catch (error) {
        console.error("Error getting file stream:", error.message);
        throw error;
    }
};

/**
 * Upload database as SQL dump to Google Drive
 */
const uploadSQLDump = async () => {
    try {
        if (!drive) return;
        const DB_PATH = path.join(__dirname, '../database.db');
        if (!fs.existsSync(DB_PATH)) return;

        console.log("[DriveService] Exporting database to SQL dump...");
        const { exportDatabaseToSQL } = require('./sqlDumpService');
        const sqlDump = exportDatabaseToSQL(DB_PATH);

        console.log(`[DriveService] SQL dump size: ${sqlDump.length} characters`);
        console.log("[DriveService] Uploading SQL dump to Drive...");

        // Find existing SQL dump if any
        const resList = await drive.files.list({
            q: `'${DB_FOLDER_ID}' in parents and name = 'database_dump.sql' and trashed=false`,
            fields: 'files(id)'
        });

        const fileMetadata = {
            name: 'database_dump.sql',
            parents: [DB_FOLDER_ID],
        };

        const bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from(sqlDump, 'utf-8'));

        const media = {
            mimeType: 'text/plain',
            body: bufferStream,
        };

        if (resList.data.files.length > 0) {
            const fileId = resList.data.files[0].id;
            await drive.files.update({
                fileId: fileId,
                media: media
            });
            console.log("[DriveService] SQL dump updated:", fileId);
        } else {
            const resCreate = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log("[DriveService] SQL dump created:", resCreate.data.id);
        }
    } catch (err) {
        console.error("[DriveService] SQL dump upload failed:", err.message);
    }
};

/**
 * Restore database from SQL dump in Google Drive
 */
const restoreSQLDump = async () => {
    try {
        if (!drive) return false;
        const DB_PATH = path.join(__dirname, '../database.db');

        console.log("[DriveService] Checking for SQL dump in Drive...");
        const res = await drive.files.list({
            q: `'${DB_FOLDER_ID}' in parents and name = 'database_dump.sql' and trashed=false`,
            fields: 'files(id, name)',
            pageSize: 1
        });

        if (res.data.files.length === 0) {
            console.log("[DriveService] No SQL dump found on Drive.");
            return false;
        }

        const dumpFile = res.data.files[0];
        console.log(`[DriveService] SQL dump detected: ${dumpFile.name}`);
        console.log(`[DriveService] Downloading SQL dump...`);

        const response = await drive.files.get(
            { fileId: dumpFile.id, alt: 'media' },
            { responseType: 'text' }
        );

        const sqlDump = response.data;
        console.log(`[DriveService] SQL dump downloaded: ${sqlDump.length} characters`);
        console.log("[DriveService] Importing SQL dump to database...");

        const { importDatabaseFromSQL } = require('./sqlDumpService');
        importDatabaseFromSQL(DB_PATH, sqlDump);

        console.log("[DriveService] SQL dump restoration complete.");
        return true;
    } catch (err) {
        console.error("[DriveService] SQL dump restore failed:", err.message);
        return false;
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
    uploadManualMaster,
    restoreManualMaster,
    uploadSQLDump,
    restoreSQLDump,
    uploadAvatar,
    uploadPartyVideo,
    getFileStream, // Export new function
    TASKS_FOLDER_ID,
    VIDEOS_FOLDER_ID,
    FILES_FOLDER_ID,
    AVATAR_FOLDER_ID,
    PARTY_FOLDER_ID
};
