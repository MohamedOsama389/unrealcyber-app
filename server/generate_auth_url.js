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

        const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000";

        const oauth2Client = new google.auth.OAuth2(
            key.client_id,
            key.client_secret,
            redirectUri
        );

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Mandatory to get refresh token every time
            scope: ['https://www.googleapis.com/auth/drive'],
        });

        console.log("-----------------------------------------");
        console.log("Using Redirect URI:", redirectUri);
        console.log("-----------------------------------------");
        console.log("AUTHORIZATION_URL_START");
        console.log(authUrl);
        console.log("AUTHORIZATION_URL_END");
        console.log("-----------------------------------------");

    } catch (err) {
        console.error("Error generating URL:", err);
    }
}

generateUrl();
