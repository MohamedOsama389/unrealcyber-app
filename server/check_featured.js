const Database = require('better-sqlite3');
const db = new Database('database.db');

console.log("--- Featured Folders ---");
const folders = db.prepare('SELECT * FROM folders_meta WHERE is_featured = 1').all();
console.log(folders);

console.log("\n--- Featured Files ---");
const files = db.prepare('SELECT * FROM files WHERE is_featured = 1').all();
console.log(files);

console.log("\n--- Featured Videos ---");
const videos = db.prepare('SELECT * FROM videos WHERE is_featured = 1').all();
console.log(videos);

db.close();
