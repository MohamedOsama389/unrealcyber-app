const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const BACKUP_PATH = path.join(BACKUP_DIR, 'database_latest.db');

/**
 * Initializes the backup directory and performs an initial restore if needed.
 */
const init = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    // Auto-restore logic removed to favor Manual Mode.
};

/**
 * Creates a new backup and deletes the old one (rotation).
 */
const performBackup = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            console.warn('[BackupService] Cannot backup: database.db not found.');
            return;
        }

        console.log('[BackupService] Creating local database backup...');
        // fs.copyFileSync overwrites by default
        fs.copyFileSync(DB_PATH, BACKUP_PATH);
        console.log('[BackupService] Local backup successful.');
    } catch (err) {
        console.error('[BackupService] Local backup failed:', err.message);
    }
};

module.exports = {
    init,
    performBackup
};
