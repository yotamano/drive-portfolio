// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log("DRIVE_FOLDER_ID:", process.env.DRIVE_FOLDER_ID);
console.log("Service account length:", (process.env.GOOGLE_SERVICE_ACCOUNT || '').length);

try {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
  console.log("Parsed successfully!");
  console.log("Keys:", Object.keys(creds));
  console.log("client_email exists:", creds.hasOwnProperty('client_email'));
  console.log("client_email value:", creds.client_email);
} catch (err) {
  console.error("Error parsing service account JSON:", err);
} 