const express = require('express');
const cors = require('cors');
const http = require('http'); // Keep http for server creation
const { Server } = require('socket.io'); // Keep Server for socket.io initialization
const fs = require('fs');
const path = require('path');
const botImport = require('./bot');
const backupService = require('./backupService');
const { initBot } = botImport; // Destructure initBot from the bot module
// Removed top-level db require
let db;

// Schema check moved to startServer function
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const driveService = require('./driveService');

let botInstance;
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

app.get('/api/party/files', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const files = await driveService.listFiles(driveService.PARTY_FOLDER_ID, 'video');
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Failed to list party files" });
    }
});

app.get('/api/party/video/:fileId', async (req, res) => {
    try {
        const range = req.headers.range;
        const response = await driveService.getFileStream(req.params.fileId, range);

        // Forward headers from Drive API to Client (Handle case-insensitivity)
        const headers = response.headers;
        const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

        const contentLength = getHeader('Content-Length');
        const contentType = getHeader('Content-Type');
        const contentRange = getHeader('Content-Range');

        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Content-Type', contentType || 'video/mp4'); // Fallback to mp4
        if (contentRange) res.setHeader('Content-Range', contentRange);

        // Always advertise Range support
        res.setHeader('Accept-Ranges', 'bytes');

        // Set status code based on Drive response (usually 200 or 206)
        res.status(response.status);

        response.data.pipe(res);
    } catch (err) {
        console.error("Video proxy error:", err.response ? err.response.status : err.message);
        // Handle 416 Range Not Satisfiable explicitly if needed, otherwise 500
        if (err.response && err.response.status === 416) return res.sendStatus(416);
        res.sendStatus(500);
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

// NEW MISSIONS ENDPOINTS
app.get('/api/missions', (req, res) => {
    try {
        console.log("[API] GET /api/missions hit");
        const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
        const tasksWithLinks = tasks.map(t => ({
            ...t,
            website_link: "https://unrealcyberacademy.up.railway.app/tasks"
        }));
        res.json(tasksWithLinks);
    } catch (err) {
        console.error("[API Error] /api/missions:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/missions/latest', (req, res) => {
    try {
        const { subject } = req.query;
        let task;
        if (subject) {
            task = db.prepare('SELECT * FROM tasks WHERE subject = ? ORDER BY created_at DESC LIMIT 1').get(subject);
        } else {
            task = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 1').get();
        }

        if (!task) return res.json(null);

        res.json({
            ...task,
            website_link: "https://unrealcyberacademy.up.railway.app/tasks"
        });
    } catch (err) {
        console.error("[API Error] /api/missions/latest:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/missions/:id', (req, res) => {
    try {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!task) return res.status(404).json({ error: "Mission not found" });
        res.json({
            ...task,
            website_link: "https://unrealcyberacademy.up.railway.app/tasks"
        });
    } catch (err) {
        console.error("[API Error] /api/missions/:id:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, drive_link, notes, subject } = req.body;
    db.prepare('INSERT INTO tasks (title, drive_link, notes, subject) VALUES (?, ?, ?, ?)').run(title, drive_link, notes, subject || 'general');

    // Notify all Telegram users instantly
    if (botInstance) {
        botInstance.broadcastMission({ title, drive_link, notes, subject: subject || 'general' });
    }

    res.json({ success: true });
});

// --- SETTINGS ---
app.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM site_settings').all();
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        res.json(settingsMap);
    } catch (err) {
        console.error("[API Error] /api/settings (GET):", err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/settings', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { telegram_enabled, telegram_link } = req.body;
    if (telegram_enabled !== undefined) {
        db.prepare('UPDATE site_settings SET value = ? WHERE key = ?').run(String(telegram_enabled), 'telegram_enabled');
    }
    if (telegram_link !== undefined) {
        db.prepare('UPDATE site_settings SET value = ? WHERE key = ?').run(telegram_link, 'telegram_link');
    }
    res.json({ success: true });
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    db.prepare('DELETE FROM student_uploads WHERE task_id = ?').run(id); // Clean up uploads first
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
});

// Admin// Confirm and notify (Unified with Rating & Notes)
app.post('/api/tasks/confirm/:uploadId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { uploadId } = req.params;
    const { rating, notes } = req.body;

    try {
        console.log(`[Admin] Unified Confirmation for upload ${uploadId}...`);
        const upload = db.prepare(`
            SELECT u.id as student_id, u.username, t.title 
            FROM student_uploads su 
            JOIN users u ON su.student_id = u.id 
            JOIN tasks t ON su.task_id = t.id 
            WHERE su.id = ?
        `).get(uploadId);

        if (!upload) {
            console.error(`[Admin] Upload ${uploadId} not found`);
            return res.status(404).json({ error: "Upload not found" });
        }

        // Update status, rating, and notes
        db.prepare('UPDATE student_uploads SET status = ?, rating = ?, admin_notes = ? WHERE id = ?').run('confirmed', rating || 0, notes || "", uploadId);
        console.log(`[Admin] Status updated to confirmed for upload ${uploadId} (Rating: ${rating})`);

        if (upload.student_id) {
            const teleUser = db.prepare('SELECT telegram_id FROM telegram_users WHERE website_user_id = ?').get(upload.student_id);
            if (teleUser && botInstance && botInstance.sendCongrats) {
                console.log(`[Admin] Notifying student ${upload.username} (ID: ${upload.student_id}) via Telegram...`);
                try {
                    await botInstance.sendCongrats(teleUser.telegram_id, upload.title, rating, notes);
                    console.log(`[Admin] Telegram notification sent to ${teleUser.telegram_id}`);
                } catch (botErr) {
                    console.error(`[Admin] Failed to send Telegram notification:`, botErr.message);
                }
            } else {
                console.warn(`[Admin] Could not notify via bot. teleUser: ${!!teleUser}, botInstance: ${!!botInstance}, studentId: ${upload.student_id}`);
            }
        }
        res.json({ success: true, message: "Mission confirmed, rated, and student notified." });
    } catch (err) {
        console.error("Confirm Fail:", err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Deny/Notify
app.post('/api/tasks/deny/:uploadId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { uploadId } = req.params;
    const { reason } = req.body;

    try {
        console.log(`[Admin] Denying upload ${uploadId} for reason: ${reason}...`);
        const upload = db.prepare(`
            SELECT u.id as student_id, u.username, t.title 
            FROM student_uploads su 
            JOIN users u ON su.student_id = u.id 
            JOIN tasks t ON su.task_id = t.id 
            WHERE su.id = ?
        `).get(uploadId);

        if (!upload) {
            console.error(`[Admin] Upload ${uploadId} not found`);
            return res.status(404).json({ error: "Upload not found" });
        }

        // Update status to denied
        db.prepare('UPDATE student_uploads SET status = ? WHERE id = ?').run('denied', uploadId);
        console.log(`[Admin] Status updated to denied for upload ${uploadId}`);

        if (upload.student_id) {
            const teleUser = db.prepare('SELECT telegram_id FROM telegram_users WHERE website_user_id = ?').get(upload.student_id);
            if (teleUser && botInstance && botInstance.sendDenial) {
                console.log(`[Admin] Sending denial notification to student ${upload.username} (ID: ${upload.student_id})...`);
                try {
                    await botInstance.sendDenial(teleUser.telegram_id, upload.title, reason || "No reason specified.");
                    console.log(`[Admin] Denial notification sent to ${teleUser.telegram_id}`);
                } catch (botErr) {
                    console.error(`[Admin] Failed to send bot denial:`, botErr.message);
                }
            } else {
                console.warn(`[Admin] Could not notify via bot (denial). teleUser: ${!!teleUser}, studentId: ${upload.student_id}`);
            }
        }
        res.json({ success: true, message: "Mission denied and student notified." });
    } catch (err) {
        console.error("Deny Fail:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN STATS ---
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const stats = db.prepare(`
            SELECT 
                u.username,
                COUNT(s.id) as total_missions,
                SUM(CASE WHEN s.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN s.status = 'denied' THEN 1 ELSE 0 END) as denied
            FROM users u
            LEFT JOIN student_uploads s ON u.id = s.student_id
            WHERE u.role = 'student'
            GROUP BY u.id
            ORDER BY confirmed DESC
        `).all();
        res.json(stats);
    } catch (err) {
        console.error("Stats Fail:", err);
        res.status(500).json({ error: err.message });
    }
});

// Student upload to GDrive
app.post('/api/tasks/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { task_id, notes } = req.body;
        const studentName = req.user.username;

        const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(task_id);
        if (!task) return res.status(404).json({ error: "Task not found" });

        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Nested structure: TASKS_FOLDER_ID -> [Student Name] -> [Mission Name]
        let studentFolderId = await driveService.findFolder(studentName, driveService.TASKS_FOLDER_ID);
        if (!studentFolderId) studentFolderId = await driveService.createFolder(studentName, driveService.TASKS_FOLDER_ID);

        let taskFolderId = await driveService.findFolder(task.title, studentFolderId);
        if (!taskFolderId) taskFolderId = await driveService.createFolder(task.title, studentFolderId);

        console.log(`[Drive] Uploading to folder: ${studentName}/${task.title}...`);
        const driveFile = await driveService.uploadFile(req.file, taskFolderId);

        // Cleanup: If there was a previous submission (pending or denied), delete it to avoid duplicates
        // This ensures the student is "re-uploading" and not just piling up files.
        db.prepare('DELETE FROM student_uploads WHERE task_id = ? AND student_id = ?').run(task_id, req.user.id);

        db.prepare('INSERT INTO student_uploads (task_id, student_id, upload_link, notes, status) VALUES (?, ?, ?, ?, ?)').run(task_id, req.user.id, driveFile.webViewLink, notes, 'pending');

        // Notify Admins on Telegram
        if (botInstance) {
            botInstance.notifyAdminsOfUpload({
                studentName: req.user.username,
                taskTitle: task.title,
                url: driveFile.webViewLink
            });
        }

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

app.delete('/api/tasks/upload/:id', authenticateToken, (req, res) => {
    const uploadId = req.params.id;
    const upload = db.prepare('SELECT * FROM student_uploads WHERE id = ?').get(uploadId);
    if (!upload) return res.status(404).json({ error: "Upload not found" });

    if (req.user.role !== 'admin' && upload.student_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to remove this mission data." });
    }

    db.prepare('DELETE FROM student_uploads WHERE id = ?').run(uploadId);
    res.json({ success: true });
});

// --- TODOS / GOALS ---
app.get('/api/todos', authenticateToken, (req, res) => {
    try {
        // Fetch personal todos for the user + general todos for everyone
        // Join with todo_completions to get the current user's completion status
        const todos = db.prepare(`
            SELECT t.*, 
                   CASE WHEN tc.completed_at IS NOT NULL THEN 1 ELSE 0 END as is_completed
            FROM todos t
            LEFT JOIN todo_completions tc ON t.id = tc.todo_id AND tc.user_id = ?
            WHERE t.user_id = ? OR t.type = 'general'
            ORDER BY t.created_at DESC
        `).all(req.user.id, req.user.id);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/todos', authenticateToken, (req, res) => {
    const { title, type } = req.body;
    const finalType = (req.user.role === 'admin' && type === 'general') ? 'general' : 'personal';
    try {
        const result = db.prepare('INSERT INTO todos (user_id, title, type) VALUES (?, ?, ?)').run(req.user.id, title, finalType);

        // Notify clients
        io.emit('todo_update');

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/todos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;
    try {
        if (is_completed) {
            db.prepare('INSERT OR IGNORE INTO todo_completions (todo_id, user_id) VALUES (?, ?)').run(id, req.user.id);
        } else {
            db.prepare('DELETE FROM todo_completions WHERE todo_id = ? AND user_id = ?').run(id, req.user.id);
        }

        // Notify clients (especially relevant if general goals show completion counters or if user has multiple devices)
        io.emit('todo_update');

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/todos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
        const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
        if (!todo) return res.status(404).json({ error: "Todo not found" });
        if (req.user.role !== 'admin' && todo.user_id !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Cleanup completions
        db.prepare('DELETE FROM todo_completions WHERE todo_id = ?').run(id);
        db.prepare('DELETE FROM todos WHERE id = ?').run(id);

        // Notify clients
        io.emit('todo_update');

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

        io.emit('party_update', partyState);
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

// --- Labs API ---
app.get('/api/labs', authenticateToken, (req, res) => {
    try {
        const labs = db.prepare('SELECT * FROM labs ORDER BY created_at DESC').all();
        res.json(labs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/labs', authenticateToken, upload.fields([
    { name: 'appFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    try {
        const { title, description } = req.body;
        const appFile = req.files['appFile'] ? req.files['appFile'][0] : null;
        const thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

        if (!appFile || !title) {
            return res.status(400).json({ error: "Title and App File are required" });
        }

        let file_id = null;
        let drive_link = null;
        let thumbnail_link = null;

        // 1. Upload App File to Drive
        const driveRes = await driveService.uploadLabFile(appFile);
        file_id = driveRes.id;
        drive_link = driveRes.webViewLink;

        // 2. Upload Thumbnail (Generic upload for now)
        if (thumbnail) {
            const thumbRes = await driveService.uploadFile(thumbnail, driveService.FILES_FOLDER_ID);
            thumbnail_link = thumbRes.webViewLink;
        }

        // 3. Save to DB
        const stmt = db.prepare('INSERT INTO labs (title, description, thumbnail_link, drive_link, file_id) VALUES (?, ?, ?, ?, ?)');
        stmt.run(title, description, thumbnail_link, drive_link, file_id);

        res.json({ success: true, message: "Lab uploaded successfully!" });
    } catch (err) {
        console.error("[Labs] Upload failed:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- HEALTH CHECK (Railway/Rentals) ---
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Secure DB Download
app.post('/api/admin/download-db', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        const valid = bcrypt.compareSync(password, user.password);

        if (!valid) {
            return res.status(401).json({ error: "Invalid password for database access." });
        }

        // IMPORTANT: Flush WAL to database.db file before download
        try {
            db.pragma('wal_checkpoint(FULL)');
            console.log("[Admin] WAL checkpoint completed for download.");
        } catch (e) {
            console.error("[Admin] WAL checkpoint failed:", e);
        }

        const DB_PATH = path.join(__dirname, '../database.db');
        if (!fs.existsSync(DB_PATH)) {
            return res.status(404).json({ error: "Database file not found on server." });
        }

        res.download(DB_PATH, `database_backup_${new Date().toISOString().split('T')[0]}.db`);
    } catch (err) {
        console.error("[Admin] DB download failed:", err);
        res.status(500).json({ error: "Failed to download database: " + err.message });
    }
});

// Export Database as SQL Text
app.post('/api/admin/export-sql', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Password required for SQL export." });
        }

        const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        const valid = await bcrypt.compare(password, admin.password);

        if (!valid) {
            return res.status(401).json({ error: "Invalid password for SQL export." });
        }

        const DB_PATH = path.join(__dirname, '../database.db');
        if (!fs.existsSync(DB_PATH)) {
            return res.status(404).json({ error: "Database file not found on server." });
        }

        // Flush WAL first
        try {
            db.pragma('wal_checkpoint(FULL)');
            console.log("[Admin] WAL checkpoint completed for SQL export.");
        } catch (e) {
            console.error("[Admin] WAL checkpoint failed:", e);
        }

        console.log("[Admin] Exporting database to SQL dump...");
        const { exportDatabaseToSQL } = require('./sqlDumpService');
        const sqlDump = exportDatabaseToSQL(DB_PATH);

        console.log(`[Admin] SQL dump generated: ${sqlDump.length} characters`);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="database_backup_${new Date().toISOString().split('T')[0]}.sql"`);
        res.send(sqlDump);
    } catch (err) {
        console.error("[Admin] SQL export failed:", err);
        res.status(500).json({ error: "Failed to export SQL: " + err.message });
    }
});

// Import Database from SQL Text
app.post('/api/admin/import-sql', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    try {
        const { sqlDump } = req.body;
        if (!sqlDump) {
            return res.status(400).json({ error: "SQL dump text required." });
        }

        const DB_PATH = path.join(__dirname, '../database.db');
        const WAL_PATH = path.join(__dirname, '../database.db-wal');
        const SHM_PATH = path.join(__dirname, '../database.db-shm');

        console.log("[Admin] Initiating SQL import sequence...");

        // 1. Force close the database connection
        if (db) {
            try {
                db.close();
                console.log("[Admin] Database connection closed.");
            } catch (e) {
                console.error("[Admin] error closing DB (continuing anyway):", e);
            }
        }

        // 2. Clean up WAL/SHM files to prevent corruption/locks
        [DB_PATH, WAL_PATH, SHM_PATH].forEach(p => {
            if (fs.existsSync(p)) {
                try {
                    fs.unlinkSync(p);
                    console.log(`[Admin] Removed: ${path.basename(p)}`);
                } catch (e) {
                    console.error(`[Admin] Could not remove ${path.basename(p)}:`, e.message);
                }
            }
        });

        // 3. Import SQL dump
        console.log("[Admin] Importing SQL dump...");
        const { importDatabaseFromSQL } = require('./sqlDumpService');
        importDatabaseFromSQL(DB_PATH, sqlDump);
        console.log("[Admin] SQL import successful.");

        // 4. SYNC TO DRIVE AS SQL DUMP
        console.log("[Admin] Syncing imported database to Drive as SQL dump...");
        await driveService.uploadSQLDump();

        // 5. Respond to client
        res.json({
            success: true,
            message: "SQL imported and synced to Drive! The system will now reboot in 2 seconds to apply changes. Please refresh the page shortly."
        });

        // 6. Force process exit after a short delay
        setTimeout(() => {
            console.log("[Admin] Rebooting server for database consistency...");
            process.exit(0);
        }, 2000);

    } catch (err) {
        console.error("[Admin] SQL import failed:", err);
        res.status(500).json({ error: "Failed to import SQL: " + err.message });
    }
});

// Manual DB Upload
app.post('/api/admin/upload-db', authenticateToken, upload.single('db'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const DB_PATH = path.join(__dirname, '../database.db');
        const WAL_PATH = path.join(__dirname, '../database.db-wal');
        const SHM_PATH = path.join(__dirname, '../database.db-shm');

        console.log("[Admin] Initiating database replacement sequence...");

        // 1. Force close the database connection
        if (db) {
            try {
                db.close();
                console.log("[Admin] Database connection closed.");
            } catch (e) {
                console.error("[Admin] error closing DB (continuing anyway):", e);
            }
        }

        // 2. Clean up WAL/SHM files to prevent corruption/locks
        [DB_PATH, WAL_PATH, SHM_PATH].forEach(p => {
            if (fs.existsSync(p)) {
                try {
                    fs.unlinkSync(p);
                    console.log(`[Admin] Removed: ${path.basename(p)}`);
                } catch (e) {
                    console.error(`[Admin] Could not remove ${path.basename(p)}:`, e.message);
                }
            }
        });

        // 3. Write the new database file locally
        fs.writeFileSync(DB_PATH, req.file.buffer);
        console.log("[Admin] New database.db written successfully.");

        // 4. SYNC TO DRIVE AS SQL DUMP (More reliable than binary)
        console.log("[Admin] Syncing uploaded database to Drive as SQL dump...");
        await driveService.uploadSQLDump();

        // 5. Respond to client
        res.json({
            success: true,
            message: "Database replaced and synced to Drive as SQL! The system will now reboot in 2 seconds to apply changes. Please refresh the page shortly."
        });

        // 6. Force process exit after a short delay
        setTimeout(() => {
            console.log("[Admin] Rebooting server for database consistency...");
            process.exit(0);
        }, 2000);

    } catch (err) {
        console.error("[Admin] Manual DB upload failed:", err);
        res.status(500).json({ error: "Failed to replace database file: " + err.message });
    }
});

// --- REACT ROUTER CATCH-ALL ---
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
    try {
        // Local DB Init (Directory creation only)
        await driveService.init();
        console.log('🚀 Google Drive Service fully started.');

        // Initialize Labs folder
        await driveService.ensureLabsFolder();
        const dbPath = path.join(__dirname, '../database.db');
        if (!fs.existsSync(dbPath)) {
            console.log("[System] Local database missing. Attempting SQL dump restore...");
            const restored = await driveService.restoreSQLDump();

            if (restored) {
                if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
                    console.log(`[System] SQL dump restored successfully. Size: ${fs.statSync(dbPath).size} bytes.`);
                } else {
                    console.error("[System] SQL dump restore reported success but file is empty or missing!");
                }
            } else {
                console.log("[System] No SQL dump found (or failed). Seeding fresh database.");
            }
        }

        // Initialize DB AFTER local check
        try {
            db = require('./database');
        } catch (dbErr) {
            console.error("FATAL: Failed to load database.db. It might be corrupt.", dbErr);
            const corruptPath = path.join(__dirname, '../database.db');
            if (fs.existsSync(corruptPath)) {
                console.log("[System] Deleting corrupt database file to allow fresh start...");
                fs.unlinkSync(corruptPath);
                // Clear module cache to allow re-requiring
                delete require.cache[require.resolve('./database')];
                db = require('./database');
                console.log("[System] Fresh database initialized after corruption recovery.");
            } else {
                throw dbErr; // If file doesn't exist but require failed, real error.
            }
        }

        // Initialize Telegram Bot
        botInstance = initBot(db);

        // Initialize Drive Service with DB for token persistence
        driveService.setDB(db);

        // Diagnostic Endpoint
        app.get('/api/admin/system-status', authenticateToken, (req, res) => {
            if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

            const status = {
                google_drive: driveService.isInitialized() ? "INITIALIZED" : "FAILED",
                google_env_vars: {
                    client_id: !!process.env.GOOGLE_CLIENT_ID,
                    client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: !!process.env.GOOGLE_REDIRECT_URI,
                    tokens: !!process.env.GOOGLE_TOKENS
                },
                database: "CONNECTED",
                server_time: new Date().toISOString()
            };
            res.json(status);
        });

        // Run migrations
        try {
            console.log("Running database migrations...");

            // 1. users table
            const userInfo = db.prepare("PRAGMA table_info(users)").all();
            if (!userInfo.some(col => col.name === 'avatar_version')) {
                console.log("Adding missing avatar_version to users...");
                db.prepare('ALTER TABLE users ADD COLUMN avatar_version INTEGER DEFAULT 0').run();
            }

            // 2. folders_meta table
            const foldersInfo = db.prepare("PRAGMA table_info(folders_meta)").all();
            if (!foldersInfo.some(col => col.name === 'parent_id')) {
                console.log("Adding missing parent_id to folders_meta...");
                db.prepare('ALTER TABLE folders_meta ADD COLUMN parent_id TEXT').run();
            }
            if (!foldersInfo.some(col => col.name === 'name')) {
                console.log("Adding missing name to folders_meta...");
                db.prepare('ALTER TABLE folders_meta ADD COLUMN name TEXT').run();
            }

            // 3. videos table
            const videosInfo = db.prepare("PRAGMA table_info(videos)").all();
            if (!videosInfo.some(col => col.name === 'resources')) {
                console.log("Adding missing resources to videos...");
                db.prepare('ALTER TABLE videos ADD COLUMN resources TEXT').run();
            }

            // 4. tasks table
            const taskInfo = db.prepare("PRAGMA table_info(tasks)").all();
            if (!taskInfo.some(col => col.name === 'subject')) {
                console.log("Adding missing subject to tasks...");
                db.prepare("ALTER TABLE tasks ADD COLUMN subject TEXT NOT NULL DEFAULT 'general'").run();
            }

            // 5. student_uploads table (MISSING STATUS FIX)
            const uploadInfo = db.prepare("PRAGMA table_info(student_uploads)").all();
            if (!uploadInfo.some(col => col.name === 'status')) {
                console.log("Adding missing status to student_uploads...");
                db.prepare("ALTER TABLE student_uploads ADD COLUMN status TEXT DEFAULT 'pending'").run();
            }

            // 6. telegram_users table
            const teleUserInfo = db.prepare("PRAGMA table_info(telegram_users)").all();
            if (teleUserInfo.length > 0 && !teleUserInfo.some(col => col.name === 'website_user_id')) {
                console.log("Adding website_user_id to telegram_users...");
                db.prepare("ALTER TABLE telegram_users ADD COLUMN website_user_id INTEGER").run();
            }

            // 7. Initialize tables
            db.exec(`
                CREATE TABLE IF NOT EXISTS telegram_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id TEXT UNIQUE NOT NULL,
                    website_user_id INTEGER,
                    username TEXT,
                    first_name TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS telegram_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    reminder_time TEXT DEFAULT '18:00',
                    enabled INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS telegram_completions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    mission_id INTEGER NOT NULL,
                    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS site_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                INSERT OR IGNORE INTO site_settings (key, value) VALUES ('telegram_enabled', 'true');
                INSERT OR IGNORE INTO site_settings (key, value) VALUES ('telegram_link', 'https://t.me/UnrealCyber_bot?start=fromWebsite');
            `);

            console.log("Migrations check complete.");
        } catch (e) {
            console.error("Database migration check failed", e);
        }

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} (Bound to 0.0.0.0 for Railway)`);
            console.log(`[System] Manual Database Mode: Automatic backups disabled.`);

            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Health Check: Server is ready.`);
        });
    } catch (e) {
        console.error("FATAL: Server startup failed", e);
    }
};

startServer();
