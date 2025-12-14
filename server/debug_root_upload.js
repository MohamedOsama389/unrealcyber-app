const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function testRootUpload() {
    try {
        console.log("Attempting Root Upload...");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from("Root Test"));

        const res = await drive.files.create({
            media: {
                mimeType: "text/plain",
                body: bufferStream,
            },
            requestBody: {
                name: "root_test.txt",
            },
        });
        console.log("Root Upload Success:", res.data.id);
    } catch (err) {
        console.error("Root Upload Failed:", err.message);
        if (err.response) {
            console.error("Reason:", JSON.stringify(err.response.data));
        }
    }
}

testRootUpload();
