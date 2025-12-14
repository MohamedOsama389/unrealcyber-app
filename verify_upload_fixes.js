const driveService = require('./server/driveService');

async function testUpload() {
    console.log("--- TESTING DRIVE UPLOAD ---");
    try {
        const dummyFile = {
            buffer: Buffer.from("Test Content Verified"),
            mimetype: "text/plain",
            originalname: "verified_upload.txt"
        };
        const result = await driveService.uploadFile(dummyFile, "StudentTest", "Debug Task");
        console.log("Upload Success:", result.webViewLink);
    } catch (err) {
        console.error("Upload FAILED. Details:");
        if (err.response) console.error(err.response.status, err.response.statusText);
        else console.error(err);
    }
}

testUpload();
