const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');

// Ensure database schema is up to date
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
} catch (e) {
    console.error("Database migration check failed", e);
}
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
        res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
        res.json({ token, role: user.role, username: user.username });
    } else {
        res.status(400).json({ error: "Invalid credentials" });
    }
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
        SELECT su.*, u.username, t.title as task_title 
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
    res.json(videos);
});


app.post('/api/videos', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, drive_link, folder_id } = req.body;
    db.prepare('INSERT INTO videos (title, drive_link, folder_id) VALUES (?, ?, ?)').run(title, drive_link, folder_id || null);
    res.json({ success: true });
});

app.post('/api/videos/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const { title, folder_id } = req.body;
        const targetFolder = folder_id || driveService.VIDEOS_FOLDER_ID;
        const driveFile = await driveService.uploadFile(req.file, targetFolder, title);
        db.prepare('INSERT INTO videos (title, drive_link, folder_id) VALUES (?, ?, ?)').run(title || req.file.originalname, driveFile.webViewLink, targetFolder);
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
    const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
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
    // Send recent messages
    const recent = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50').all().reverse();
    socket.emit('init_messages', recent);

    socket.on('send_message', (data) => {
        // data: { username, content }
        const result = db.prepare('INSERT INTO messages (username, content) VALUES (?, ?)').run(data.username, data.content);
        const msg = { id: result.lastInsertRowid, username: data.username, content: data.content, timestamp: new Date() };
        io.emit('new_message', msg);
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (Bound to 0.0.0.0 for Railway)`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health Check: Server is ready.`);
});
