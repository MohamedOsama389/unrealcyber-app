const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Path to the OAuth Client ID file provided by the user
// Note: Based on previous file listing, it might be in the root or downloads, 
// checking relevant paths.
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
            key.redirect_uris ? key.redirect_uris[0] : 'http://localhost'
        );

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Critical for Refresh Token
            scope: ['https://www.googleapis.com/auth/drive'],
        });

        console.log("AUTHORIZATION_URL_START");
        console.log(authUrl);
        console.log("AUTHORIZATION_URL_END");

    } catch (err) {
        console.error("Error generating URL:", err);
    }
}

generateUrl();
