const fs = require('fs');

try {
    // Attempt to read and find the JSON part of the error
    let content = fs.readFileSync('final_error.log', 'utf16le');
    // Look for JSON structure { ... }
    const match = content.match(/{[\s\S]*}/);
    if (match) {
        // Attempt to cleanup and parse
        console.log("Found JSON-like content:");
        console.log(match[0]);
    } else {
        console.log("No JSON found. Content:");
        console.log(content.substring(0, 500));
    }
} catch (e) {
    console.error(e);
}
