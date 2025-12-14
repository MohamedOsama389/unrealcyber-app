const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function checkPermissions() {
    try {
        const fileId = '1EzdCa49QHIUc7udBqqobuwMHcggSVTn2'; // Tasks Folder
        const res = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, capabilities, permissions'
        });

        console.log("Folder:", res.data.name);
        console.log("Capabilities:", JSON.stringify(res.data.capabilities, null, 2));
    } catch (err) {
        console.error("Error getting folder details:", err.message);
    }
}

checkPermissions();
