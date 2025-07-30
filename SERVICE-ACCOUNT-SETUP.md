# Google Service Account Setup Guide

This guide will walk you through setting up a Google Service Account to use with your Drive Portfolio site.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a name for your project (e.g., "Drive Portfolio")
5. Click "Create"

## Step 2: Enable the Google Drive API

1. In your new project, navigate to "APIs & Services" > "Library" from the left menu
2. Search for "Google Drive API"
3. Click on the Google Drive API card
4. Click "Enable"

## Step 3: Create a Service Account

1. Navigate to "IAM & Admin" > "Service Accounts" from the left menu
2. Click "Create Service Account"
3. Enter a name for your service account (e.g., "drive-portfolio-service")
4. Add a description (optional)
5. Click "Create and Continue"
6. You don't need to grant this service account access to the project, so click "Continue"
7. You don't need to grant users access to this service account, so click "Done"

## Step 4: Create a Key for the Service Account

1. From the service accounts list, click on the email address of the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" as the key type
5. Click "Create"
6. The key file will be downloaded to your computer automatically. Keep this file secure!

## Step 5: Share Your Drive Folder with the Service Account

1. Open your Google Drive
2. Navigate to your portfolio folder (or create one if you haven't already)
3. Right-click on the folder and select "Share"
4. In the "Add people and groups" field, enter the email address of your service account
   (It will look something like `drive-portfolio-service@your-project-id.iam.gserviceaccount.com`)
5. Change the permission to "Viewer"
6. Uncheck "Notify people"
7. Click "Share"

## Step 6: Get Your Drive Folder ID

1. Open your Google Drive and navigate to your portfolio folder
2. Look at the URL in your browser's address bar
3. The folder ID is the part after "folders/" in the URL
   (e.g., in `https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz`, the folder ID is `1AbCdEfGhIjKlMnOpQrStUvWxYz`)

## Step 7: Configure Your Local Environment

1. Create a `.env.local` file in your project root with the following content:
   ```
   DRIVE_FOLDER_ID=your_folder_id
   GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"..."}
   ```
   Replace `your_folder_id` with your Drive folder ID from Step 6, and paste the entire contents of the JSON key file you downloaded in Step 4 as the value for `GOOGLE_SERVICE_ACCOUNT`.

2. Make sure to properly format the JSON for a single line by:
   - Removing all newlines
   - Escaping quotes if necessary

## Step 8: Configure GitHub Secrets (for Deployment)

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Create a secret named `DRIVE_FOLDER_ID` with your Drive folder ID as the value
5. Click "Add secret"
6. Create another secret named `GOOGLE_SERVICE_ACCOUNT` with the entire JSON content of your service account key file (formatted as a single line) as the value
7. Click "Add secret"

## Testing Your Setup

To test that everything is working:

1. Run the following commands locally:
   ```bash
   npm install
   mkdir -p public/content
   npm run generate-content
   ```

2. If the command completes successfully, check the `public/content` directory for the generated content files.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to http://localhost:3000 to see your portfolio!

## Troubleshooting

- **Error: "No access, refresh token or API key is set."**
  - Check that your service account JSON is properly formatted in the environment variable.
  
- **Error: "The caller does not have permission"**
  - Make sure you shared your Drive folder with the service account email.
  - Verify the folder ID is correct.
  
- **No files are showing up**
  - Check that you've placed files in your Drive folder according to the expected structure.
  - Make sure the service account has "Viewer" access to the folder.
  
- **Content is not displaying correctly**
  - Make sure your folder structure follows the expected pattern.
  - Check that your Google Docs are properly formatted. 