const { google } = require('googleapis');

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000';

// PASS THE CODE AS AN ARGUMENT: node exchange_v2.js YOUR_CODE_HERE
const code = process.argv[2];

if (!code) {
    console.error("❌ ERROR: Missing Auth Code!");
    console.log("Usage: node exchange_v2.js <CODE_FROM_URL>");
    process.exit(1);
}

if (!client_id || !client_secret) {
    console.error("❌ ERROR: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing!");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
);

async function run() {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log("\n✅ TOKENS GENERATED SUCCESSFULLY!");
        console.log("\n--- COPY THE JSON BELOW INTO YOUR RAILWAY 'GOOGLE_TOKENS' VARIABLE ---");
        console.log(JSON.stringify(tokens));
        console.log("----------------------------------------------------------------------\n");
    } catch (err) {
        console.error("❌ EXCHANGE FAILED:", err.message);
    }
}

run();
