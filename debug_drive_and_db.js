const driveService = require('./server/driveService');
const db = require('./server/database');

async function testVideo() {
    console.log("--- TESTING DRIVE UPLOAD ---");
    try {
        const dummyFile = {
            buffer: Buffer.from("Test Content"),
            mimetype: "text/plain",
            originalname: "test_upload_debug.txt"
        };
        // Simulated user: StudentTest, Task: "Debug Task"
        // We need a simulated task in DB for the title? 
        // driveService uses taskTitle directly passed to it.
        const result = await driveService.uploadFile(dummyFile, "StudentTest", "Debug Task");
        console.log("Upload Success:", result.webViewLink);
    } catch (err) {
        console.error("Upload FAILED. Details:");
        console.error(err);
    }
}

async function testVM() {
    console.log("--- TESTING VM TOGGLE ---");
    try {
        const id = 1;
        const before = db.prepare('SELECT status FROM vms WHERE id = ?').get(id);
        console.log(`Before: ${before ? before.status : 'Not Found'}`);

        const newStatus = before.status === 'online' ? 'offline' : 'online';
        db.prepare('UPDATE vms SET status = ? WHERE id = ?').run(newStatus, id);

        const after = db.prepare('SELECT status FROM vms WHERE id = ?').get(id);
        console.log(`After (Expected ${newStatus}): ${after ? after.status : 'Not Found'}`);
    } catch (err) {
        console.error("VM Toggle FAILED:", err);
    }
}

(async () => {
    await testVM();
    await testVideo();
})();
