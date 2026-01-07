const fs = require('fs');
const path = require('path');
const driveService = require('./server/driveService');

const uploadTestVideo = async () => {
    try {
        const filePath = path.join('c:\\Users\\Xb132\\Downloads\\Cyber!!!!!!!!', 'Download.mp4');
        if (!fs.existsSync(filePath)) {
            console.error("File not found:", filePath);
            return;
        }

        const buffer = fs.readFileSync(filePath);
        const fileName = 'AutoTest_Download.mp4';
        const mimeType = 'video/mp4';

        console.log(`Uploading ${fileName} to Party Folder (${driveService.PARTY_FOLDER_ID})...`);

        const fileId = await driveService.uploadPartyVideo(buffer, fileName, mimeType);

        console.log("Upload Success!");
        console.log("File ID:", fileId);
    } catch (err) {
        console.error("Upload Failed:", err);
    }
};

uploadTestVideo();
