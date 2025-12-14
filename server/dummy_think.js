const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
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

        // Note: Code might be single use. If it fails, I might need to ask user again.
        // But likely it succeeded and output just wasn't captured.
        // I'll try to retrieve the refresh token from the PREVIOUS run if possible?
        // No, I can't. I'll blindly try to exchange again.
        // If it fails with "invalid_grant", it means the code was already used.
        // But wait, the previous run output "TOKENS_RECEIVED" so it worked.
        // I just didn't see the full json.

        // BETTER STRATEGY: Rerun without writing to file, just log refresh token.
        // But since I can't replay the code.......

        // Wait, if the previous command `node exchange_token.js > tokens.json` ran, 
        // the content IS in tokens.json, I just failed to read it properly.
        // I will try to read tokens.json properly.

    } catch (err) {
        console.error(err);
    }
}
