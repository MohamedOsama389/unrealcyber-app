const { google } = require('googleapis');

// Use Env Vars so it works in any environment
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000'; // Standard for this flow

if (!client_id || !client_secret) {
    console.error("❌ ERROR: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in environment!");
    console.error("Please add them to your Railway variables or .env file first.");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
});

console.log("\n--- COPY THE LINK BELOW AND OPEN IT IN YOUR BROWSER ---");
console.log(authUrl);
console.log("-------------------------------------------------------\n");
