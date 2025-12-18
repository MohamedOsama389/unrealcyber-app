const db = require('./server/database');

try {
    console.log("Adding folder_id to videos table...");
    db.exec("ALTER TABLE videos ADD COLUMN folder_id TEXT;");
    console.log("Success.");
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log("Column already exists.");
    } else {
        console.error("Migration failed:", err);
    }
}
process.exit(0);
