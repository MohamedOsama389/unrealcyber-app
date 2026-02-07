const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
const db = new Database(dbPath, { readonly: true });

try {
    const labs = db.prepare('SELECT title, thumbnail_link, file_id FROM labs').all();
    console.log("--- Lab Thumbnails Debug ---");
    labs.forEach(lab => {
        console.log(`Title: ${lab.title}`);
        console.log(`Thumbnail Link: ${lab.thumbnail_link}`);
        console.log(`File ID (App): ${lab.file_id}`);
        console.log("----------------------------");
    });
} catch (err) {
    console.error("Error reading DB:", err.message);
}
