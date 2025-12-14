const fs = require('fs');

try {
    const content = fs.readFileSync('auth_url.txt', 'utf16le');
    const match = content.match(/https:\/\/accounts\.google\.com[^\s\r\n]+/);
    if (match) {
        console.log(match[0]);
    } else {
        console.log("No URL found");
    }
} catch (e) {
    console.error(e);
}
