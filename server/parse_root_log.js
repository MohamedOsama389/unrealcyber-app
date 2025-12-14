const fs = require('fs');

try {
    const content = fs.readFileSync('root_upload_log.txt', 'utf8'); // or utf16le
    console.log(content);
} catch (e) {
    try {
        const content = fs.readFileSync('root_upload_log.txt', 'utf16le');
        console.log(content);
    } catch (e2) { console.error(e2); }
}
