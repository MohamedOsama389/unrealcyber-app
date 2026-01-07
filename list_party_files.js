const driveService = require('./server/driveService');

const listFiles = async () => {
    try {
        const files = await driveService.listFiles(driveService.PARTY_FOLDER_ID, 'video');
        console.log("Party Files:");
        files.forEach(f => console.log(`[${f.id}] ${f.name}`));
    } catch (err) {
        console.error("List Failed:", err);
    }
};

listFiles();
