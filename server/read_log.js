const fs = require('fs');
try {
    const content = fs.readFileSync('final_error.log', 'utf8'); // or 'utf16le' if needed
    console.log(content);
} catch (e) {
    // try reading as utf16le if utf8 fails or looks weird? 
    // Usually 'type' output redirected in PS is utf16le.
    const content = fs.readFileSync('final_error.log', 'utf16le');
    console.log(content);
}
