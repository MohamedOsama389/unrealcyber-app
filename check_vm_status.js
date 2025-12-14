const db = require('./server/database.js');
const vm = db.prepare('SELECT status FROM vms WHERE id = 1').get();
console.log("VM 1 Status:", vm);
