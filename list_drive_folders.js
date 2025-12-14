const driveService = require('./server/driveService');
const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'server/service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: 'v3', auth });

const fs = require('fs');

async function listFolders() {
    console.log("Listing folders accessible to Service Account...");
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name, webViewLink, parents)',
        });

        if (res.data.files.length === 0) {
            fs.writeFileSync('folders_output.txt', "No folders found.");
        } else {
            const output = res.data.files.map(f => `- Name: ${f.name} | ID: ${f.id} | Link: ${f.webViewLink}`).join('\n');
            fs.writeFileSync('folders_output.txt', output);
            console.log("Output written to folders_output.txt");
        }
    } catch (err) {
        console.error("Error listing folders:", err);
    }
}

listFolders();
