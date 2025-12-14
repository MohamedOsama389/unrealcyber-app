const db = require('./server/database.js');

try {
    console.log("Attempting to add 'status' column to vms table...");
    db.prepare("ALTER TABLE vms ADD COLUMN status TEXT DEFAULT 'offline'").run();
    console.log("Success: Column added.");
} catch (err) {
    if (err.message.includes("duplicate column name")) {
        console.log("Info: Column 'status' already exists.");
    } else {
        console.error("Migration Error:", err);
    }
}
