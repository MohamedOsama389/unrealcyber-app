const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function listTaskFolders() {
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='Tasks' and trashed=false",
            fields: 'files(id, capabilities)',
        });

        console.log("START_LIST");
        res.data.files.forEach(f => {
            console.log(`ID:${f.id}|WRITE:${f.capabilities.canAddChildren}`);
        });
        console.log("END_LIST");

    } catch (err) {
        console.error(err);
    }
}

listTaskFolders();
