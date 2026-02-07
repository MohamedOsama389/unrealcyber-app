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
let LABS_FOLDER_ID = null; // Dynamically resolved

let drive;
let oauth2Client;
let dbInstance;
let keys;
let tokens;

const initOAuth = (tokens) => {
    try {
        if (!keys || !keys.client_id || !keys.client_secret) {
            console.error("❌ Cannot initialize OAuth: Missing keys (client_id/client_secret)");
            return false;
        }

        const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000";
        oauth2Client = new google.auth.OAuth2(
            keys.client_id,
            keys.client_secret,
            redirectUri
        );

        if (tokens) {
            oauth2Client.setCredentials(tokens);
            console.log("✅ Google tokens applied from source.");
        }

        oauth2Client.on('tokens', (newTokens) => {
            if (!newTokens) return;
            console.log("✅ Google tokens refreshed.");
            const updated = { ...oauth2Client.credentials, ...newTokens };

            // 1. Save to DB if available
            if (dbInstance) {
                try {
                    dbInstance.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('google_tokens', JSON.stringify(updated));
                    console.log("Tokens saved to database.");
                } catch (dbErr) {
                    console.error("Failed to save tokens to database:", dbErr.message);
                }
            }

            // 2. Save to local file (Dev fallback)
            try {
                fs.writeFileSync(TOKENS_PATH, JSON.stringify(updated, null, 2));
            } catch (e) { }

            console.log("📢 Railway/Production Tip: Update GOOGLE_TOKENS env var if DB is not persistent.");
        });

        drive = google.drive({ version: 'v3', auth: oauth2Client });
        console.log(`Drive Service Initialized with Redirect URI: ${redirectUri}`);
        return true;
    } catch (err) {
        console.error("Failed to init OAuth2:", err.message);
        return false;
    }
};

const setDB = (db) => {
    dbInstance = db;
    // Try to load tokens from DB
    try {
        const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('google_tokens');
        if (row && row.value) {
            console.log("Loading Google Tokens from Database...");
            const tokens = JSON.parse(row.value);
            initOAuth(tokens);
        }
    } catch (err) {
        console.error("Failed to load tokens from site_settings:", err.message);
    }
};

const init = async () => {
    try {
        // 1. Try Environment Variables for Keys
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            console.log("Loading Credentials (Keys) from Environment Variables...");
            keys = {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET
            };
        }
        // Fallback to Local Files for Keys
        else if (fs.existsSync(CREDENTIALS_PATH)) {
            console.log("Loading Credentials (Keys) from Local Credentials File...");
            const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
            keys = creds.web || creds.installed;
        }

        // 2. Try Environment Variables for Tokens
        if (process.env.GOOGLE_TOKENS) {
            try {
                console.log("Found Google Tokens in Environment Variables.");
                tokens = JSON.parse(process.env.GOOGLE_TOKENS);
            } catch (e) {
                console.error("Failed to parse GOOGLE_TOKENS env var:", e.message);
            }
        }
        // Fallback to Local Tokens File
        else if (fs.existsSync(TOKENS_PATH)) {
            try {
                console.log("Found Google Tokens in Local Tokens File.");
                tokens = JSON.parse(fs.readFileSync(TOKENS_PATH));
            } catch (e) {
                console.error("Failed to parse local tokens file:", e.message);
            }
        }

        if (keys) {
            const success = initOAuth(tokens);
            if (success) {
                console.log("🚀 Google Drive Service fully started.");
                return true;
            } else {
                console.error("❌ Google Drive Service failed to start after key loading.");
                return false;
            }
        } else {
            console.error("❌ FAILED to load Google credentials keys (ID/Secret). Drive features will be disabled.");
            console.log("ℹ️ Troubleshooting: Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your environment variables.");
            return false;
        }
    } catch (err) {
        console.error("Failed to initialize Drive with OAuth2:", err.message);
        return false;
    }
};

// Initial trigger if not running as a module (Optional but keep it safe)
// if (require.main === module) init();

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
        if (!drive) {
            console.log("[DriveService] Drive not initialized.");
            return false;
        }
        const DB_PATH = path.join(__dirname, '../database.db');

        console.log("[DriveService] Checking for SQL dump in Drive...");

        // Retry up to 3 times with delays (Drive API might have propagation delay)
        let res;
        for (let attempt = 1; attempt <= 3; attempt++) {
            res = await drive.files.list({
                q: `'${DB_FOLDER_ID}' in parents and name = 'database_dump.sql' and trashed=false`,
                fields: 'files(id, name, modifiedTime)',
                pageSize: 1,
                orderBy: 'modifiedTime desc'
            });

            if (res.data.files.length > 0) {
                console.log(`[DriveService] SQL dump found on attempt ${attempt}`);
                break;
            }

            if (attempt < 3) {
                console.log(`[DriveService] SQL dump not found, retrying in 2 seconds (attempt ${attempt}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (res.data.files.length === 0) {
            console.log("[DriveService] No SQL dump found on Drive after 3 attempts.");
            return false;
        }

        const dumpFile = res.data.files[0];
        console.log(`[DriveService] SQL dump detected: ${dumpFile.name} (ID: ${dumpFile.id})`);
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
        console.error("[DriveService] Full error:", err);
        return false;
    }
};

const uploadLabFile = async (fileObject) => {
    return uploadFile(fileObject, LABS_FOLDER_ID);
};

/**
 * Try to fetch a Google-generated thumbnail for any file.
 * - If the file is an image, stream the original file.
 * - Otherwise, if Drive provides a thumbnailLink, stream that image.
 * Returns null when no thumbnail is available.
 */
const getThumbnailStream = async (fileId) => {
    try {
        if (!drive) throw new Error("Google Drive Service not initialized");

        // Lightweight metadata fetch
        const meta = await drive.files.get({
            fileId,
            fields: 'mimeType, thumbnailLink'
        });

        const mime = meta.data.mimeType || '';
        const thumbLink = meta.data.thumbnailLink;

        // 1) If file itself is an image, stream it directly
        if (mime.startsWith('image/')) {
            const resp = await drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream' }
            );
            return { stream: resp.data, contentType: mime };
        }

        // 2) Otherwise, attempt to stream Drive-generated thumbnail
        if (thumbLink) {
            const axios = require('axios');
            const headers = {};
            if (oauth2Client?.credentials?.access_token) {
                headers.Authorization = `Bearer ${oauth2Client.credentials.access_token}`;
            }

            const thumbResp = await axios.get(thumbLink, {
                responseType: 'stream',
                headers
            });
            const ct = thumbResp.headers['content-type'] || 'image/jpeg';
            return { stream: thumbResp.data, contentType: ct };
        }

        return null;
    } catch (err) {
        console.error("[DriveService] getThumbnailStream failed:", err.message);
        return null;
    }
};

const getLabsFromDrive = async () => {
    if (!LABS_FOLDER_ID) await ensureLabsFolder();
    return listFiles(LABS_FOLDER_ID, 'file'); // Using 'file' as a generic type here
};

/**
 * Ensures the Labs folder exists in Google Drive.
 * 1. Checks site_settings DB for cached ID.
 * 2. If not found, searches Drive for "Hands-On Labs".
 * 3. If still not found, creates it under the same parent as FILES_FOLDER_ID.
 */
const ensureLabsFolder = async () => {
    try {
        if (!drive) return null;

        // 1. Check Site Settings
        if (dbInstance) {
            const row = dbInstance.prepare('SELECT value FROM site_settings WHERE key = ?').get('labs_folder_id');
            if (row && row.value) {
                console.log(`[DriveService] Using cached Labs folder ID from database: ${row.value}`);
                LABS_FOLDER_ID = row.value;
                return LABS_FOLDER_ID;
            }
        }

        console.log("[DriveService] Resolving Labs folder...");

        // 2. Search Drive
        const query = "name = 'Hands-On Labs' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        const res = await drive.files.list({ q: query, fields: 'files(id, name)' });

        if (res.data.files && res.data.files.length > 0) {
            LABS_FOLDER_ID = res.data.files[0].id;
            console.log(`[DriveService] Found existing Labs folder in Drive: ${LABS_FOLDER_ID}`);
        } else {
            // 3. Create Folder
            console.log("[DriveService] Labs folder not found. Creating new folder...");

            // Try to find parent of FILES_FOLDER_ID
            let parentId = 'root';
            try {
                const filesFolder = await drive.files.get({ fileId: FILES_FOLDER_ID, fields: 'parents' });
                if (filesFolder.data.parents && filesFolder.data.parents.length > 0) {
                    parentId = filesFolder.data.parents[0];
                }
            } catch (pErr) {
                console.warn("[DriveService] Could not determine parent for Labs, using root.");
            }

            LABS_FOLDER_ID = await createFolder("Hands-On Labs", parentId);
            console.log(`[DriveService] Created new Labs folder: ${LABS_FOLDER_ID}`);
        }

        // 4. Save to Site Settings
        if (dbInstance && LABS_FOLDER_ID) {
            dbInstance.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('labs_folder_id', LABS_FOLDER_ID);
        }

        return LABS_FOLDER_ID;
    } catch (err) {
        console.error("[DriveService] Failed to ensure Labs folder:", err.message);
        return null;
    }
};

module.exports = {
    init,
    uploadFile,
    listFiles,
    listFolders,
    findFolder,
    createFolder,
    isInitialized,
    getLiveStatus,
    setDB, // Export new function
    backupDatabase,
    restoreDatabase,
    uploadManualMaster,
    restoreManualMaster,
    uploadSQLDump,
    restoreSQLDump,
    uploadAvatar,
    uploadPartyVideo,
    uploadLabFile,
    getThumbnailStream,
    getLabsFromDrive,
    ensureLabsFolder, // Export new function
    getFileStream, // Export new function
    TASKS_FOLDER_ID,
    VIDEOS_FOLDER_ID,
    FILES_FOLDER_ID,
    AVATAR_FOLDER_ID,
    PARTY_FOLDER_ID
};
