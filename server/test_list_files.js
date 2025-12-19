const driveService = require('./driveService');

const testList = async () => {
    console.log("Listing PDF files for root folder:", driveService.FILES_FOLDER_ID);
    const files = await driveService.listFiles(driveService.FILES_FOLDER_ID, 'pdf');
    console.log("Files found:", files.length);
    if (files.length > 0) {
        console.log("First file webViewLink:", files[0].webViewLink);
    } else {
        console.log("No files found. Check folder permissions and ID.");
    }
};

testList();
