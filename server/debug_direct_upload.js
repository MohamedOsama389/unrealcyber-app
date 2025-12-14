const driveService = require('./driveService');

async function testDirectUpload() {
    try {
        console.log("TEST_START");

        const dummyFile = {
            buffer: Buffer.from("Test Content"),
            originalname: "direct_debug_file.txt",
            mimetype: "text/plain"
        };

        const uniqueStudent = "Debug_Student_" + Date.now();
        const uniqueTask = "Debug_Task_" + Date.now();

        console.log(`Target: Student='${uniqueStudent}', Task='${uniqueTask}'`);

        await driveService.uploadFile(dummyFile, uniqueStudent, uniqueTask);
        console.log("TEST_SUCCESS");

    } catch (err) {
        console.log("TEST_FAILED");
        console.log("ERR_MESSAGE: " + err.message);
        if (err.response) {
            console.log("ERR_CODE: " + err.response.status);
            console.log("ERR_DATA: " + JSON.stringify(err.response.data));
        }
    }
}

testDirectUpload();
