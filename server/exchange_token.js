const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');

// The code provided by the user
const CODE = "4/0ATX87lOduAxCd8ZSE7bDIHUh0yQWh24xaVs-tZPlhXGurjLpW_zK7ToB3EXmk56QrBy6wA";

async function exchange() {
    try {
        const content = fs.readFileSync(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;

        const oauth2Client = new google.auth.OAuth2(
            key.client_id,
            key.client_secret,
            'http://localhost:3000'
        );

        const { tokens } = await oauth2Client.getToken(CODE);
        console.log("TOKENS_RECEIVED");
        console.log(JSON.stringify(tokens, null, 2));

    } catch (err) {
        console.error("Error exchanging token:", err);
    }
}

exchange();
