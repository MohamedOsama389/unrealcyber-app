const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_1028956746376-n64suev71rvp27qbpj573ec3efctj75k.apps.googleusercontent.com.json');
const TOKENS_PATH = path.join(__dirname, 'final_tokens.json');

console.log("=== COPY THESE VALUES TO RENDER ENVIRONMENT VARIABLES ===");
console.log("");

if (fs.existsSync(CREDENTIALS_PATH)) {
    const keys = JSON.parse(fs.readFileSync(CREDENTIALS_PATH)).web;
    console.log("Key: GOOGLE_CLIENT_ID");
    console.log("Value:");
    console.log(keys.client_id);
    console.log("");
    console.log("Key: GOOGLE_CLIENT_SECRET");
    console.log("Value:");
    console.log(keys.client_secret);
} else {
    console.log("ERROR: Credentials file not found!");
}

console.log("");

if (fs.existsSync(TOKENS_PATH)) {
    const tokens = fs.readFileSync(TOKENS_PATH, 'utf8');
    console.log("Key: GOOGLE_TOKENS");
    console.log("Value:");
    console.log(tokens);
    // Just printing the raw JSON string is exactly what we need
} else {
    console.log("ERROR: Tokens file not found!");
}

console.log("");
console.log("=== END OF SECRETS ===");
