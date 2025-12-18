const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');
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

        // Get Task Title for folder naming
        const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(task_id);
        if (!task) return res.status(404).json({ error: "Task not found" });

        // Upload to Drive
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const driveFile = await driveService.uploadFile(req.file, studentName, task.title);

        // Ephemeral DB Fix: Ensure student exists before FK check
        // If DB was wiped, the User ID from JWT won't exist. We recreate a placeholder.
        const dummyHash = "$2a$10$Ephemera1DBPlaceho1derHa5h"; // Placeholder
        db.prepare('INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)').run(req.user.id, req.user.username, dummyHash, req.user.role);

        // Save metadata to DB
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
        res.json(folders);
    } catch (err) {
        res.status(500).json({ error: "Failed to list folders" });
    }
});


// --- VIDEOS ---
// --- VIDEOS ---
app.get('/api/videos', authenticateToken, async (req, res) => {
    const folderId = req.query.folderId || driveService.VIDEOS_FOLDER_ID;
    try {
        const driveFiles = await driveService.listFiles(folderId, 'video');
        const insert = db.prepare('INSERT OR IGNORE INTO videos (title, drive_link, folder_id) VALUES (?, ?, ?)');
        const check = db.prepare('SELECT id FROM videos WHERE drive_link = ?');

        const tx = db.transaction((files) => {
            for (const f of files) {
                if (!check.get(f.webViewLink)) {
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
    const { title, drive_link } = req.body;
    db.prepare('INSERT INTO videos (title, drive_link) VALUES (?, ?)').run(title, drive_link);
    res.json({ success: true });
});

app.put('/api/videos/:id/feature', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    db.transaction(() => {
        const current = db.prepare('SELECT is_featured FROM videos WHERE id = ?').get(id);
        db.prepare('UPDATE videos SET is_featured = 0').run();
        if (!current || current.is_featured === 0) {
            db.prepare('UPDATE videos SET is_featured = 1 WHERE id = ?').run(id);
        }
    })();
    res.json({ success: true });
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
        const check = db.prepare('SELECT id FROM files WHERE drive_link = ?');

        const tx = db.transaction((files) => {
            for (const f of files) {
                if (!check.get(f.webViewLink)) {
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

app.put('/api/files/:id/feature', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    db.transaction(() => {
        const current = db.prepare('SELECT is_featured FROM files WHERE id = ?').get(id);
        db.prepare('UPDATE files SET is_featured = 0').run();
        if (!current || current.is_featured === 0) {
            db.prepare('UPDATE files SET is_featured = 1 WHERE id = ?').run(id);
        }
    })();
    res.json({ success: true });
});

app.delete('/api/files/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.get('/api/dashboard/featured', authenticateToken, (req, res) => {
    const video = db.prepare('SELECT * FROM videos WHERE is_featured = 1').get();
    const file = db.prepare('SELECT * FROM files WHERE is_featured = 1').get();
    res.json({ featuredVideo: video, featuredFile: file });
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

app.post('/api/users/promote', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id, role } = req.body;
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
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
