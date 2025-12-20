const Database = require('better-sqlite3');
const db = new Database('database.db');

try {
    console.log("Checking for parent_id in folders_meta...");
    const info = db.prepare("PRAGMA table_info(folders_meta)").all();
    const hasParentId = info.some(col => col.name === 'parent_id');

    if (!hasParentId) {
        console.log("Adding parent_id column to folders_meta...");
        db.prepare("ALTER TABLE folders_meta ADD COLUMN parent_id TEXT").run();
        console.log("Column added successfully.");
    } else {
        console.log("parent_id already exists.");
    }
} catch (err) {
    console.error("Migration failed:", err.message);
} finally {
    db.close();
}
