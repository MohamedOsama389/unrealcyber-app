const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const paths = [
    path.join(__dirname, '../database.db'),
    path.join(__dirname, 'database.db'),
    'e:\\Personal Projects\\Cyber!!!!!!!!\\database.db',
    'e:\\Personal Projects\\Cyber!!!!!!!!\\server\\database.db',
    'e:\\Personal Projects\\Cyber!!!!!!!!\\server\\database.db'
];

for (const p of paths) {
    if (fs.existsSync(p)) {
        console.log(`Checking DB at: ${p}`);
        try {
            const db = new Database(p, { readonly: true });
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            if (tables.some(t => t.name === 'labs')) {
                const labs = db.prepare('SELECT title, thumbnail_link, file_id FROM labs').all();
                if (labs.length > 0) {
                    console.log("--- FOUND LABS ---");
                    labs.forEach(lab => {
                        console.log(`Title: ${lab.title}`);
                        console.log(`Thumbnail Link: ${lab.thumbnail_link}`);
                        console.log(`File ID: ${lab.file_id}`);
                        console.log("------------------");
                    });
                    break;
                } else {
                    console.log("Labs table empty.");
                }
            } else {
                console.log("No 'labs' table found.");
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}
