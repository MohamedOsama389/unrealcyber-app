const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const CODE = "4/0ASc3gC0-P3Pf91nhJqphSpk3RUWJ20myfFc_EpIs27bBnE2Gm6RoWVYTMjkth-acqI18DA";

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

        fs.writeFileSync('final_tokens.json', JSON.stringify(tokens, null, 2));
        console.log("Tokens written to final_tokens.json");

    } catch (err) {
        console.error("Error exchanging token:", JSON.stringify(err, null, 2));
        console.error(err);
    }
}

exchange();
