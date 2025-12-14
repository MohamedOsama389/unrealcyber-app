const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function checkQuota() {
    try {
        const res = await drive.about.get({
            fields: 'storageQuota, user'
        });

        console.log("User:", res.data.user.emailAddress);
        const quota = res.data.storageQuota;
        console.log("Storage Quota:");
        console.log(`  Limit: ${quota.limit}`);
        console.log(`  Usage: ${quota.usage}`);
        console.log(`  UsageInDrive: ${quota.usageInDrive}`);
        console.log(`  UsageInDriveTrash: ${quota.usageInDriveTrash}`);

    } catch (err) {
        console.error(err);
    }
}

checkQuota();
