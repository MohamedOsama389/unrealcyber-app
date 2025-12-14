const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function listFolders() {
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name)',
            pageSize: 50
        });

        fs.writeFileSync('folders_list.json', JSON.stringify(res.data.files, null, 2));
        console.log("Done");
    } catch (err) {
        console.error('Error:', err);
    }
}

listFolders();
