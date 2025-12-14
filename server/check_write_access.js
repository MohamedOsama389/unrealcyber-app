const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function checkWriteAccess() {
    try {
        const fileId = '1EzdCa49QHIUc7udBqqobuwMHcggSVTn2'; // Tasks Folder
        const res = await drive.files.get({
            fileId: fileId,
            fields: 'capabilities(canAddChildren, canEdit, canDelete)'
        });

        console.log("canAddChildren:", res.data.capabilities.canAddChildren);
        console.log("canEdit:", res.data.capabilities.canEdit);
        console.log("canDelete:", res.data.capabilities.canDelete);

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkWriteAccess();
