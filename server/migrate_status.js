const Database = require('better-sqlite3');
const db = new Database('database.db');

try {
    console.log("Migrating server/database.db...");
    db.prepare("ALTER TABLE vms ADD COLUMN status TEXT DEFAULT 'offline'").run();
    console.log("Migration Successful: 'status' column added.");
} catch (err) {
    if (err.message.includes("duplicate column")) {
        console.log("Column 'status' already exists.");
    } else {
        console.error("Migration Failed:", err);
    }
}
