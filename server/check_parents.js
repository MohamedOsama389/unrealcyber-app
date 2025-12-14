const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function checkParents() {
    try {
        const res = await drive.files.list({
            q: "name = 'student_test_1765712384741'",
            fields: 'files(id, name, parents)',
        });
        console.log(JSON.stringify(res.data.files, null, 2));
    } catch (err) {
        console.error(err);
    }
}

checkParents();
