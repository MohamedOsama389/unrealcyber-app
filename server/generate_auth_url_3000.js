const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');

async function generateUrl() {
    try {
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            console.error("Error: Credentials file not found at", CREDENTIALS_PATH);
            return;
        }

        const content = fs.readFileSync(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;

        const oauth2Client = new google.auth.OAuth2(
            key.client_id,
            key.client_secret,
            'http://localhost:3000' // UPDATED to port 3000
        );

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive'],
            prompt: 'consent' // Force consent to ensure we get a Refresh Token
        });

        console.log("AUTHORIZATION_URL_START");
        console.log(authUrl);
        console.log("AUTHORIZATION_URL_END");

    } catch (err) {
        console.error("Error generating URL:", err);
    }
}

generateUrl();
