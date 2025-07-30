
const { google } = require('googleapis');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    console.log('Attempting to access the Google Drive API...');
    
    const res = await drive.about.get({ fields: 'user' });
    
    console.log('Successfully accessed the Google Drive API.');
    console.log('User:', res.data.user);
  } catch (error) {
    console.error('Error accessing Google Drive API:', error);
  }
}

main(); 