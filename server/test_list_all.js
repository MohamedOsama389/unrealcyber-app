const driveService = require('./driveService');
const { google } = require('googleapis');
const auth = require('./auth');

const testListAll = async () => {
    console.log("Listing ALL files (any type) for folder:", driveService.FILES_FOLDER_ID);
    const drive = google.drive({ version: 'v3', auth: await auth.getAuthClient() });

    const res = await drive.files.list({
        q: `'${driveService.FILES_FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
    });

    const files = res.data.files;
    console.log("Total files found:", files.length);
    files.forEach(f => {
        console.log(`- ${f.name} (${f.mimeType}) [${f.id}]`);
    });
};

testListAll();
