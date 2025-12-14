const { google } = require('googleapis');
const path = require('path');

// The file the user likely wants us to try
const CANDIDATE_FILE = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');

console.log("Testing file:", CANDIDATE_FILE);

try {
    const auth = new google.auth.GoogleAuth({
        keyFile: CANDIDATE_FILE,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    auth.getCredentials().then(creds => {
        console.log("Credentials loaded successfully?");
        console.log("Client Email:", creds.client_email);
        console.log("Private Key present:", !!creds.private_key);
    }).catch(err => {
        console.error("Authentication Failed:");
        console.error(err.message);
    });

} catch (e) {
    console.error("Initialization Failed:", e.message);
}
