const db = require('./server/database.js');

try {
    console.log("--- TABLE INFO ---");
    const info = db.prepare('PRAGMA table_info(vms)').all();
    console.log(info);

    console.log("--- TEST UPDATE ---");
    const res = db.prepare("UPDATE vms SET status = 'online' WHERE id = 1").run();
    console.log("Update result:", res);
} catch (err) {
    console.error("ERROR:", err);
}
