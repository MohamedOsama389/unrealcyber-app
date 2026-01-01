const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');

// Get the code from command line arguments or keep the template
const CODE = process.argv[2] || "YOUR_CODE_HERE";

async function exchange() {
    try {
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            console.error("Credentials file missing.");
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

        console.log("Exchanging code with Redirect URI:", redirectUri);
        const { tokens } = await oauth2Client.getToken(CODE);
        console.log("TOKENS_RECEIVED");
        console.log(JSON.stringify(tokens, null, 2));
        console.log("-----------------------------------------");
        console.log("Update your tokens file or Railway env var with the above JSON.");

    } catch (err) {
        console.error("Error exchanging token:", err.message);
    }
}

exchange();
