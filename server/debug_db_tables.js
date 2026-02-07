const Database = require('better-sqlite3');
const path = require('path');

// Try to find the DB in strict location
const dbPath = path.join(__dirname, 'database.db');
console.log(`Checking DB at: ${dbPath}`);

try {
    const db = new Database(dbPath, { readonly: true });

    // List tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("--- Tables in DB ---");
    tables.forEach(t => console.log(t.name));

    // If 'labs' exists, desc it
    if (tables.some(t => t.name === 'labs')) {
        console.log("\n--- 'labs' Table Schema ---");
        const schema = db.prepare("PRAGMA table_info(labs)").all();
        console.log(schema);
    }

} catch (err) {
    console.error("Error reading DB:", err.message);
}
