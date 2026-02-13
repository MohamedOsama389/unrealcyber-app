const sqlite3 = require('e:/Personal Projects/Cyber!!!!!!!!/server/node_modules/better-sqlite3');
const db = sqlite3('e:/Personal Projects/Cyber!!!!!!!!/server/database.db');
const users = db.prepare('SELECT id, username, private_access FROM users').all();
console.log(JSON.stringify(users, null, 2));
db.close();
