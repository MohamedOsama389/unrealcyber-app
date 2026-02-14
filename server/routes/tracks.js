const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/tracks - List all tracks
router.get('/', (req, res) => {
    try {
        const tracks = db.prepare('SELECT * FROM tracks ORDER BY created_at DESC').all();
        res.json(tracks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tracks/:id - Get track details + steps
router.get('/:id', (req, res) => {
    try {
        const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id);
        if (!track) return res.status(404).json({ error: 'Track not found' });

        const steps = db.prepare('SELECT * FROM track_steps WHERE track_id = ? ORDER BY order_index ASC').all(req.params.id);
        res.json({ ...track, steps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tracks - Create Track (Admin)
router.post('/', (req, res) => {
    const { title, description, icon } = req.body;
    try {
        const info = db.prepare('INSERT INTO tracks (title, description, icon) VALUES (?, ?, ?)').run(title, description, icon);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tracks/:id/steps - Add Step (Admin)
router.post('/:id/steps', (req, res) => {
    const { title, type, online_id, drive_id, upload_url, order_index } = req.body;
    try {
        const info = db.prepare('INSERT INTO track_steps (track_id, title, type, online_id, drive_id, upload_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            req.params.id,
            title,
            type,
            online_id || null,
            drive_id || null,
            upload_url || null,
            order_index
        );
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tracks/progress/user - Get user's progress for ALL tracks
router.get('/progress/user', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        // Return a map of step_id -> status
        const progress = db.prepare('SELECT step_id, status FROM track_progress WHERE user_id = ?').all(req.user.id);
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tracks/progress/:stepId - Update Status
router.post('/progress/:stepId', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.body;
    try {
        db.prepare(`
            INSERT INTO track_progress (user_id, step_id, status, completed_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, step_id) DO UPDATE SET status = ?, completed_at = CURRENT_TIMESTAMP
        `).run(req.user.id, req.params.stepId, status, status);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/tracks/:id - Remove Track (Admin)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        // Use a transaction for atomic deletion
        const deleteTransaction = db.transaction(() => {
            // 1. Delete progress
            db.prepare('DELETE FROM track_progress WHERE step_id IN (SELECT id FROM track_steps WHERE track_id = ?)').run(id);
            // 2. Delete steps
            db.prepare('DELETE FROM track_steps WHERE track_id = ?').run(id);
            // 3. Delete track
            db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
        });

        deleteTransaction();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
