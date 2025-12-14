const db = require('./server/database');

console.log("--- VM 1 STATUS CHECK ---");
const before = db.prepare('SELECT status FROM vms WHERE id = 1').get();
console.log("Before:", before);

const newStatus = before.status === 'online' ? 'offline' : 'online';
db.prepare('UPDATE vms SET status = ? WHERE id = 1').run(newStatus);

const after = db.prepare('SELECT status FROM vms WHERE id = 1').get();
console.log("After:", after);
