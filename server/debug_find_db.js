const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const rootDir = 'e:\\Personal Projects\\Cyber!!!!!!!!';

function findDbFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            findDbFiles(filePath, fileList);
        } else if (file.endsWith('.db')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

console.log(`Current Working Directory: ${process.cwd()}`);
const dbFiles = findDbFiles(rootDir);

console.log(`\nFound ${dbFiles.length} .db files:`);
dbFiles.forEach(dbPath => {
    const size = fs.statSync(dbPath).size;
    console.log(`\nChecking: ${dbPath} (${size} bytes)`);
    try {
        const db = new Database(dbPath, { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const tableNames = tables.map(t => t.name).join(', ');
        console.log(`Tables: ${tableNames}`);

        if (tableNames.includes('labs')) {
            const count = db.prepare('SELECT count(*) as c FROM labs').get();
            console.log(`LABS COUNT: ${count.c}`);
            if (count.c > 0) {
                const labs = db.prepare('SELECT thumbnail_link FROM labs').all();
                console.log('Sample Links:', labs.slice(0, 3));
            }
        }
    } catch (e) {
        console.log(`Error reading DB: ${e.message}`);
    }
});
