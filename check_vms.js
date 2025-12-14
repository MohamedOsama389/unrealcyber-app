const db = require('./server/database.js');
const vm = db.prepare('SELECT * FROM vms WHERE id = 25').get(); // Subagent clicked index 25, which corresponds to ID?
// Wait, index 25? The subagent clicked "Index": 25. That's the element index in the DOM, not the DB ID.
// I should check ALL VMs.
const vms = db.prepare('SELECT * FROM vms').all();
console.log(JSON.stringify(vms, null, 2));
