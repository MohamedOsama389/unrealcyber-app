const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const CODE = "4/0ATX87lP3uq0LLdNamxQWGgILx94ChVg_RIcBSVSFEM8f2iCZmpLbUG6FoXbAf6mOG1s7tg";

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
        console.error("Error exchanging token:", err);
    }
}

exchange();
