const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
// Removed top-level db require
let db;

// Schema check moved to startServer function
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const driveService = require('./driveService');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in this demo/free host
        methods: ["GET", "POST"]
    }
});

// --- PARTY MODE STATE ---
let partyState = {
    active: false,
    videoSource: '', // Drive ID or URL
    currentTime: 0,
    isPlaying: false,
    type: 'drive', // 'drive' or 'youtube'
    messages: []
};
// ... (keep middle content implicitly by not touching it, wait, replace_file_content replaces block)
// I need two separate chunks or one large chunk. I will use multi_replace for safety.

app.use(cors());
app.use(express.json());

const path = require('path');

const SECRET_KEY = "UNREAL_CYBER_SECRET_KEY_2026"; // In prod, use .env

// Serve Static Files (Production)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/health', async (req, res) => {
    const driveStatus = await driveService.getLiveStatus();
    res.json({
        database: "OK",
        drive: driveStatus
    });
});

// --- AUTH ---
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    try {
        const hash = bcrypt.hashSync(password, 10);
        const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, 'student');
        driveService.backupDatabase(); // Persist new user immediately
        res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (user && bcrypt.compareSync(password, user.password)) {
        // --- STREAK LOGIC ---
        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.last_activity_date;
        let newStreak = user.streak_count || 0;

        if (!lastDate) {
            newStreak = 1;
        } else if (lastDate !== today) {
            const last = new Date(lastDate);
            const t = new Date(today);
            const diffDays = Math.floor((t - last) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        }

        db.prepare('UPDATE users SET streak_count = ?, last_activity_date = ? WHERE id = ?').run(newStreak, today, user.id);

        // Trigger a backup if critical data changed or just periodically?
        // For now, let's keep it in login to ensure student progress is backed up
        driveService.backupDatabase();

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
        res.json({
            token,
            role: user.role,
            username: user.username,
            username: user.username,
            avatar_id: user.avatar_id,
            avatar_version: user.avatar_version,
            streak_count: newStreak
        });
    }
});

// --- PROFILE ---
app.get('/api/profile/me', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, username, role, avatar_id, avatar_version, streak_count, last_activity_date FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

app.post('/api/profile/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            console.error("[AvatarUpload] No file provided in request.");
            return res.status(400).json({ error: "No file uploaded" });
        }
        console.log(`[AvatarUpload] Processing file: ${req.file.originalname} (${req.file.size} bytes)`);
        const avatarId = await driveService.uploadAvatar(req.file.buffer, req.file.originalname, req.file.mimetype);
        console.log(`[AvatarUpload] Drive upload successful. ID: ${avatarId}`);
        const version = Date.now();
        db.prepare('UPDATE users SET avatar_id = ?, avatar_version = ? WHERE id = ?').run(avatarId, version, req.user.id);
        driveService.backupDatabase(); // Persist avatar change immediately
        res.json({ success: true, avatar_id: avatarId, avatar_version: version });
    } catch (err) {
        console.error("[AvatarUpload] Error:", err);
        res.status(500).json({ error: "Avatar upload failed", details: err.message });
    }
});

// --- PARTY MODE ENDPOINTS ---
app.post('/api/party/config', authenticateToken, upload.single('video'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const { source, type } = req.body;
        let videoId = source;

        if (req.file) {
            videoId = await driveService.uploadPartyVideo(req.file.buffer, req.file.originalname, req.file.mimetype);
        }

        partyState = {
            ...partyState,
            videoSource: videoId,
            type: type || 'drive',
            currentTime: 0,
            isPlaying: false
        };

        io.emit('party_update', partyState);
        res.json({ success: true, partyState });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/party/toggle', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    partyState.active = !partyState.active;
    if (!partyState.active) {
        partyState.isPlaying = false;
        partyState.messages = [];
    }
    io.emit('party_update', partyState);
    res.json({ success: true, active: partyState.active });
});

app.post('/api/socket-relay', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { event, data } = req.body;

    if (event === 'party_action') {
        if (data.action === 'play') partyState.isPlaying = true;
        if (data.action === 'pause') partyState.isPlaying = false;
        // Broadcast the updated state
        io.emit('party_update', partyState);
    }

    res.json({ success: true });
});

// --- VOTING SYSTEM ---
app.get('/api/votes/active', authenticateToken, (req, res) => {
    const votes = db.prepare('SELECT * FROM votes WHERE is_active = 1').all();
    // Parse options string back to array
    const votesWithParsedOptions = votes.map(v => ({
        ...v,
        options: JSON.parse(v.options)
    }));
    res.json(votesWithParsedOptions);
});

app.get('/api/votes', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const votes = db.prepare('SELECT * FROM votes ORDER BY created_at DESC').all();
    const results = db.prepare(`
        SELECT vote_id, option_index, COUNT(*) as count 
        FROM vote_results 
        GROUP BY vote_id, option_index
    `).all();

    const votesWithData = votes.map(v => {
        const voteOptions = JSON.parse(v.options);
        const voteResults = results.filter(r => r.vote_id === v.id);
        const resultsMap = {};
        voteOptions.forEach((_, idx) => {
            const found = voteResults.find(r => r.option_index === idx);
            resultsMap[idx] = found ? found.count : 0;
        });

        return {
            ...v,
            options: voteOptions,
            results: resultsMap
        };
    });

    res.json(votesWithData);
});

app.post('/api/votes', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, options } = req.body;
    db.prepare('INSERT INTO votes (title, options) VALUES (?, ?)').run(title, JSON.stringify(options));
    res.json({ success: true });
});

app.put('/api/votes/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { title, options } = req.body;
    db.prepare('UPDATE votes SET title = ?, options = ? WHERE id = ?').run(title, JSON.stringify(options), id);
    res.json({ success: true });
});

app.post('/api/votes/:id/vote', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { optionIndex } = req.body;
    try {
        db.prepare('INSERT OR REPLACE INTO vote_results (vote_id, user_id, option_index) VALUES (?, ?, ?)').run(id, req.user.id, optionIndex);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Voting failed" });
    }
});

app.post('/api/votes/:id/toggle', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const vote = db.prepare('SELECT is_active FROM votes WHERE id = ?').get(id);
    if (!vote) return res.status(404).json({ error: "Poll not found" });
    db.prepare('UPDATE votes SET is_active = ? WHERE id = ?').run(vote.is_active ? 0 : 1, id);
    res.json({ success: true });
});

app.delete('/api/votes/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    db.prepare('DELETE FROM vote_results WHERE vote_id = ?').run(id);
    db.prepare('DELETE FROM votes WHERE id = ?').run(id);
    res.json({ success: true });
});

// --- MEETINGS ---
// Get meeting status
app.get('/api/meetings', (req, res) => {
    const meeting = db.prepare('SELECT * FROM meetings ORDER BY id DESC LIMIT 1').get();
    res.json(meeting || { is_active: 0 });
});

// Admin update meeting
app.post('/api/meetings', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { link, is_active } = req.body;
    db.prepare('INSERT INTO meetings (link, is_active) VALUES (?, ?)').run(link, is_active ? 1 : 0);
    res.json({ success: true });
});

// --- TASKS ---
app.get('/api/tasks', authenticateToken, (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    res.json(tasks);
});

app.post('/api/tasks', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, drive_link, notes } = req.body;
    db.prepare('INSERT INTO tasks (title, drive_link, notes) VALUES (?, ?, ?)').run(title, drive_link, notes);
    res.json({ success: true });
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    db.prepare('DELETE FROM student_uploads WHERE task_id = ?').run(id); // Clean up uploads first
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
});

// Student upload to GDrive
app.post('/api/tasks/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { task_id, notes } = req.body;
        const studentName = req.user.username;

        const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(task_id);
        if (!task) return res.status(404).json({ error: "Task not found" });

        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Maintain old folder structure logic for student tasks
        let studentFolderId = await driveService.findFolder(studentName, driveService.TASKS_FOLDER_ID);
        if (!studentFolderId) studentFolderId = await driveService.createFolder(studentName, driveService.TASKS_FOLDER_ID);

        let taskFolderId = await driveService.findFolder(task.title, studentFolderId);
        if (!taskFolderId) taskFolderId = await driveService.createFolder(task.title, studentFolderId);

        const driveFile = await driveService.uploadFile(req.file, taskFolderId);

        const dummyHash = "$2a$10$Ephemera1DBPlaceho1derHa5h";
        db.prepare('INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)').run(req.user.id, req.user.username, dummyHash, req.user.role);

        db.prepare('INSERT INTO student_uploads (task_id, student_id, upload_link, notes) VALUES (?, ?, ?, ?)').run(task_id, req.user.id, driveFile.webViewLink, notes);

        res.json({ success: true, link: driveFile.webViewLink });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message || "Failed to upload to Google Drive" });
    }
});

// Admin view uploads
app.get('/api/tasks/uploads', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const uploads = db.prepare(`
        SELECT su.*, u.username, u.avatar_id, t.title as task_title 
        FROM student_uploads su 
        JOIN users u ON su.student_id = u.id 
        JOIN tasks t ON su.task_id = t.id
    `).all();
    res.json(uploads);
});

// Student view their own uploads
app.get('/api/tasks/my-submissions', authenticateToken, (req, res) => {
    const submissions = db.prepare('SELECT * FROM student_uploads WHERE student_id = ?').all(req.user.id);
    res.json(submissions);
});

// Rate task
app.post('/api/tasks/rate', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id, rating, admin_notes } = req.body;
    db.prepare('UPDATE student_uploads SET rating = ?, admin_notes = ? WHERE id = ?').run(rating, admin_notes, id);
    res.json({ success: true });
});

// Delete upload (Admin or Owner)
app.delete('/api/tasks/upload/:id', authenticateToken, (req, res) => {
    const uploadId = req.params.id;
    // Check ownership or admin
    const upload = db.prepare('SELECT * FROM student_uploads WHERE id = ?').get(uploadId);
    if (!upload) return res.status(404).json({ error: "Upload not found" });

    if (req.user.role !== 'admin' && upload.student_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to remove this mission data." });
    }

    db.prepare('DELETE FROM student_uploads WHERE id = ?').run(uploadId);
    // Note: We are deleting the DB record. The file remains on Drive for safety/logs unless extended logic added.
    res.json({ success: true });
});

// --- DRIVE FOLDERS ---
app.get('/api/drive/folders/:parentId', authenticateToken, async (req, res) => {
    try {
        const folders = await driveService.listFolders(req.params.parentId);
        if (!folders || !Array.isArray(folders)) return res.json([]);

        // Enrich with featured status from DB
        const enriched = folders.map(f => {
            const meta = db.prepare('SELECT is_featured FROM folders_meta WHERE id = ?').get(f.id);
            return { ...f, is_featured: meta ? meta.is_featured : 0 };
        });
        res.json(enriched);
    } catch (err) {
        console.error("[API Error] Failed to list folders:", err);
        res.status(500).json({ error: "Failed to list folders", details: err.message });
    }
});

app.post('/api/drive/folders', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, parentId } = req.body;
    try {
        const folderId = await driveService.createFolder(name, parentId);
        res.json({ success: true, folderId });
    } catch (err) {
        res.status(500).json({ error: "Failed to create folder" });
    }
});

app.post('/api/folders/:id/feature', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { parentId, name } = req.body;
    console.log(`[FeatureToggle] Folder: ${id}, Name: ${name}, Parent: ${parentId}`);

    try {
        db.transaction(() => {
            // First ensure a record exists
            db.prepare('INSERT OR IGNORE INTO folders_meta (id, is_featured, parent_id, name) VALUES (?, 0, ?, ?)').run(id, parentId || null, name || null);

            // Get current and toggle
            const current = db.prepare('SELECT is_featured FROM folders_meta WHERE id = ?').get(id);
            const next = current.is_featured ? 0 : 1;

            db.prepare('UPDATE folders_meta SET is_featured = ?, parent_id = ?, name = ? WHERE id = ?').run(next, parentId || null, name || null, id);
            console.log(`[FeatureToggle] Folder ${id} is now ${next ? 'Featured' : 'Unfeatured'}`);
        })();
        res.json({ success: true });
    } catch (err) {
        console.error("[FeatureToggle Error] Folder:", err);
        res.status(500).json({ error: err.message });
    }
});


// --- VIDEOS ---
// --- VIDEOS ---
app.get('/api/videos', authenticateToken, async (req, res) => {
    const folderId = req.query.folderId || driveService.VIDEOS_FOLDER_ID;
    try {
        const driveFiles = await driveService.listFiles(folderId, 'video');
        const insert = db.prepare('INSERT OR IGNORE INTO videos (title, drive_link, folder_id) VALUES (?, ?, ?)');
        const update = db.prepare('UPDATE videos SET folder_id = ? WHERE drive_link = ?');
        const check = db.prepare('SELECT id FROM videos WHERE drive_link = ?');

        const tx = db.transaction((files) => {
            for (const f of files) {
                if (check.get(f.webViewLink)) {
                    update.run(folderId, f.webViewLink);
                } else {
                    insert.run(f.name, f.webViewLink, folderId);
                }
            }
        });

        if (driveFiles.length > 0) tx(driveFiles);
    } catch (err) {
        console.error("Video sync failed:", err);
    }

    const query = req.query.folderId
        ? 'SELECT * FROM videos WHERE folder_id = ? ORDER BY created_at DESC'
        : 'SELECT * FROM videos WHERE folder_id IS NULL OR folder_id = ? ORDER BY created_at DESC';

    const videos = db.prepare(query).all(folderId);

    // Parse resources JSON
    const videosWithResources = videos.map(v => {
        try {
            return { ...v, resources: v.resources ? JSON.parse(v.resources) : [] };
        } catch (e) {
            return { ...v, resources: [] };
        }
    });

    res.json(videosWithResources);
});


app.post('/api/videos', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, drive_link, folder_id, resources } = req.body;
    db.prepare('INSERT INTO videos (title, drive_link, folder_id, resources) VALUES (?, ?, ?, ?)').run(title, drive_link, folder_id || null, JSON.stringify(resources || []));
    driveService.backupDatabase();
    res.json({ success: true });
});

app.post('/api/videos/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const { title, folder_id, resources } = req.body;
        const targetFolder = folder_id || driveService.VIDEOS_FOLDER_ID;
        const driveFile = await driveService.uploadFile(req.file, targetFolder, title);

        let parsedResources = [];
        try {
            parsedResources = JSON.parse(resources || '[]');
        } catch (e) { }

        db.prepare('INSERT INTO videos (title, drive_link, folder_id, resources) VALUES (?, ?, ?, ?)').run(title || req.file.originalname, driveFile.webViewLink, targetFolder, JSON.stringify(parsedResources));
        driveService.backupDatabase();
        res.json({ success: true, link: driveFile.webViewLink });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

app.post('/api/videos/:id/feature', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    try {
        db.transaction(() => {
            const videoId = parseInt(id);
            const current = db.prepare('SELECT is_featured FROM videos WHERE id = ?').get(videoId);

            // Toggle logic: Only one video can be featured at a time
            db.prepare('UPDATE videos SET is_featured = 0').run();
            if (!current || current.is_featured === 0) {
                db.prepare('UPDATE videos SET is_featured = 1 WHERE id = ?').run(videoId);
                console.log(`[FeatureToggle] Video ${id} now featured.`);
            } else {
                console.log(`[FeatureToggle] Video ${id} now unfeatured.`);
            }
        })();
        res.json({ success: true });
    } catch (err) {
        console.error("[FeatureToggle Error] Video:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/videos/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// --- FILES ---
app.get('/api/files', authenticateToken, async (req, res) => {
    const folderId = req.query.folderId || driveService.FILES_FOLDER_ID;
    try {
        const driveFiles = await driveService.listFiles(folderId, 'pdf');
        const insert = db.prepare('INSERT OR IGNORE INTO files (title, drive_link, folder_id) VALUES (?, ?, ?)');
        const update = db.prepare('UPDATE files SET folder_id = ? WHERE drive_link = ?');
        const check = db.prepare('SELECT id FROM files WHERE drive_link = ?');

        const tx = db.transaction((files) => {
            for (const f of files) {
                if (check.get(f.webViewLink)) {
                    update.run(folderId, f.webViewLink);
                } else {
                    insert.run(f.name, f.webViewLink, folderId);
                }
            }
        });

        if (driveFiles.length > 0) tx(driveFiles);
    } catch (err) {
        console.error("Files sync failed:", err);
    }

    const query = req.query.folderId
        ? 'SELECT * FROM files WHERE folder_id = ? ORDER BY created_at DESC'
        : 'SELECT * FROM files WHERE folder_id IS NULL OR folder_id = ? ORDER BY created_at DESC';

    const files = db.prepare(query).all(folderId);
    res.json(files);
});

app.post('/api/files/:id/feature', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    console.log(`[FeatureToggle] File: ${id}`);

    try {
        db.transaction(() => {
            const fileId = parseInt(id);
            const current = db.prepare('SELECT is_featured FROM files WHERE id = ?').get(fileId);

            // Toggle logic: Only one file can be featured at a time
            db.prepare('UPDATE files SET is_featured = 0').run();
            if (!current || current.is_featured === 0) {
                db.prepare('UPDATE files SET is_featured = 1 WHERE id = ?').run(fileId);
                console.log(`[FeatureToggle] File ${id} now featured.`);
            } else {
                console.log(`[FeatureToggle] File ${id} now unfeatured.`);
            }
        })();
        res.json({ success: true });
    } catch (err) {
        console.error("[FeatureToggle Error] File:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/files/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.post('/api/files', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, drive_link, folder_id } = req.body;
    db.prepare('INSERT OR IGNORE INTO files (title, drive_link, folder_id) VALUES (?, ?, ?)').run(title, drive_link, folder_id);
    res.json({ success: true });
});

app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const { title, folder_id } = req.body;
        const targetFolder = folder_id || driveService.FILES_FOLDER_ID;
        const driveFile = await driveService.uploadFile(req.file, targetFolder, title);
        db.prepare('INSERT INTO files (title, drive_link, folder_id) VALUES (?, ?, ?)').run(title || req.file.originalname, driveFile.webViewLink, targetFolder);
        res.json({ success: true, link: driveFile.webViewLink });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

app.get('/api/dashboard/featured', authenticateToken, (req, res) => {
    const video = db.prepare('SELECT * FROM videos WHERE is_featured = 1').get();
    const file = db.prepare('SELECT * FROM files WHERE is_featured = 1').get();
    const folderIds = db.prepare('SELECT * FROM folders_meta WHERE is_featured = 1').all();

    // We don't have a folder name here easily without Drive API, but we store the IDs.
    // Dashboard can just show them as "Quick Access" or similar.
    res.json({ featuredVideo: video, featuredFile: file, featuredFolders: folderIds });
});


// --- VMs ---
app.get('/api/vms', authenticateToken, (req, res) => {
    const vms = db.prepare('SELECT * FROM vms ORDER BY created_at DESC').all();
    res.json(vms);
});

app.post('/api/vms', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, ip, type, username, password, status } = req.body;
    db.prepare('INSERT INTO vms (name, ip, type, username, password, status) VALUES (?, ?, ?, ?, ?, ?)').run(name, ip, type, username, password, status || 'offline');
    io.emit('vm_update');
    res.json({ success: true });
});

app.post('/api/vms/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id, status } = req.body;
    db.prepare('UPDATE vms SET status = ? WHERE id = ?').run(status, id);
    io.emit('vm_update');
    res.json({ success: true });
});

app.put('/api/vms/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { name, ip, type, username, password } = req.body;
    db.prepare('UPDATE vms SET name=?, ip=?, type=?, username=?, password=? WHERE id=?').run(name, ip, type, username, password, id);
    io.emit('vm_update');
    res.json({ success: true });
});

app.delete('/api/vms/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    db.prepare('DELETE FROM vms WHERE id = ?').run(id);
    io.emit('vm_update');
    res.json({ success: true });
});

// --- USERS ---
app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const users = db.prepare('SELECT id, username, role, avatar_id, created_at FROM users').all();
    res.json(users);
});

app.post('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { username, password, role } = req.body;
    try {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, role || 'student');
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

app.post('/api/users/promote', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id, role } = req.body;
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    res.json({ success: true });
});

app.put('/api/users/:id/password', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id);
    res.json({ success: true });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    // Protect 'Lloyed'
    const targetUser = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
    if (targetUser && targetUser.username === 'Lloyed') {
        return res.status(403).json({ error: "Main admin cannot be deleted." });
    }

    db.transaction(() => {
        // Delete uploads first
        db.prepare('DELETE FROM student_uploads WHERE student_id = ?').run(id);
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();
    res.json({ success: true });
});

// --- CHAT (Socket.io) ---
io.on('connection', (socket) => {
    console.log('User connected to socket');

    // Send initial party state
    socket.emit('party_update', partyState);

    // Send recent messages
    const recent = db.prepare(`
        SELECT m.*, u.avatar_id, u.avatar_version 
        FROM messages m 
        LEFT JOIN users u ON m.username = u.username 
        ORDER BY m.timestamp DESC 
        LIMIT 50
    `).all().reverse();
    socket.emit('init_messages', recent);

    socket.on('send_message', (data) => {
        // data: { username, content }
        const result = db.prepare('INSERT INTO messages (username, content) VALUES (?, ?)').run(data.username, data.content);
        const user = db.prepare('SELECT avatar_id, avatar_version FROM users WHERE username = ?').get(data.username);
        const msg = {
            id: result.lastInsertRowid,
            username: data.username,
            content: data.content,
            timestamp: new Date(),
            avatar_id: user?.avatar_id,
            avatar_version: user?.avatar_version
        };
        io.emit('new_message', msg);
    });

    // --- PARTY SOCKETS ---
    socket.on('party_action', (data) => {
        // data: { action: 'play'|'pause'|'seek', time: number }
        if (data.action === 'play') partyState.isPlaying = true;
        if (data.action === 'pause') partyState.isPlaying = false;
        if (data.time !== undefined) partyState.currentTime = data.time;

        socket.broadcast.emit('party_update', partyState);
    });

    socket.on('party_chat', (data) => {
        // data: { username, avatar_id, avatar_version, content }
        const pocketMsg = {
            ...data,
            timestamp: new Date()
        };
        partyState.messages.push(pocketMsg);
        if (partyState.messages.length > 100) partyState.messages.shift();
        io.emit('party_chat_update', partyState.messages);
    });
});

// --- HEALTH CHECK (Railway/Rentals) ---
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// --- REACT ROUTER CATCH-ALL ---
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
    try {
        // Restore DB logic
        if (driveService.isInitialized()) {
            console.log("Drive initialized, attempting to restore database...");
            await driveService.restoreDatabase();
        } else {
            console.log("Drive NOT initialized, skipping restore.");
        }

        // Initialize DB AFTER restore
        db = require('./database');

        // Check for avatar_version column
        try {
            const userInfo = db.prepare("PRAGMA table_info(users)").all();
            const hasVersion = userInfo.some(col => col.name === 'avatar_version');
            if (!hasVersion) {
                console.log("Adding missing avatar_version to users...");
                db.prepare('ALTER TABLE users ADD COLUMN avatar_version INTEGER DEFAULT 0').run();
            }
        } catch (e) { console.error("Avatar version migration failed", e); }

        // Run migrations
        try {
            const info = db.prepare("PRAGMA table_info(folders_meta)").all();
            const hasParentId = info.some(col => col.name === 'parent_id');
            const hasName = info.some(col => col.name === 'name');
            if (!hasParentId) {
                console.log("Adding missing parent_id to folders_meta...");
                db.prepare('ALTER TABLE folders_meta ADD COLUMN parent_id TEXT').run();
            }
            if (!hasName) {
                console.log("Adding missing name to folders_meta...");
                db.prepare('ALTER TABLE folders_meta ADD COLUMN name TEXT').run();
            }
            const videoInfo = db.prepare("PRAGMA table_info(videos)").all();
            const hasResources = videoInfo.some(col => col.name === 'resources');
            if (!hasResources) {
                console.log("Adding missing resources to videos...");
                db.prepare('ALTER TABLE videos ADD COLUMN resources TEXT').run();
            }
        } catch (e) {
            console.error("Database migration check failed", e);
        }

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} (Bound to 0.0.0.0 for Railway)`);

            // SCHEDULE BACKUPS (Every 12 hours)
            setInterval(() => {
                driveService.backupDatabase();
            }, 12 * 60 * 60 * 1000);

            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Health Check: Server is ready.`);
        });
    } catch (e) {
        console.error("FATAL: Server startup failed", e);
    }
};

startServer();
