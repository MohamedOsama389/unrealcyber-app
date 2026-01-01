const driveService = require('./server/driveService');
const db = require('./server/database');

async function test() {
    console.log("Testing listFolders...");
    try {
        const folders = await driveService.listFolders('14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_');
        console.log("Folders result:", folders);

        const enriched = folders.map(f => {
            const meta = db.prepare('SELECT is_featured FROM folders_meta WHERE id = ?').get(f.id);
            return { ...f, is_featured: meta ? meta.is_featured : 0 };
        });
        console.log("Enriched result:", enriched);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
