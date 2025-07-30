# Drive Portfolio

A minimalist portfolio site that mirrors content from a Google Drive folder, presenting it with an iOS Notes-like aesthetic. The site automatically reflects any changes made to the Drive folder structure and contents.

## Features

- **Google Drive Integration**: Content syncs directly from your Drive folder
- **iOS Notes-like Design**: Clean, minimalist black-on-white presentation
- **Responsive Layout**: Works on desktop and mobile devices
- **Static Site Generation**: Fast performance with no server-side code
- **GitHub Pages Compatible**: Easy deployment with zero maintenance
- **Automatic Updates**: Changes in Drive are reflected on the site
- **Accessibility**: WCAG-AA compliant with full keyboard navigation

## Project Structure

The site follows this content structure:

```
Drive root
├─ Folder = "Tag / Category"    → collapsible section in the list
│    └─ Sub-folder = Project    → opens as a full-page note
│        ├─ One primary Doc     → main body of the note
│        └─ Images / Videos     → embed inline in body order
└─ Loose Docs in root           → stand-alone pages (e.g., "About")
```

## Setup Instructions

### 1. Google Drive Setup

1. Create a folder in your Google Drive to be the root of your portfolio
2. Add documents and subfolders following the structure above
3. Note the folder ID (from the URL when you're in that folder)

### 2. Google Service Account Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Drive API
4. Go to "IAM & Admin" > "Service Accounts"
5. Create a new service account
6. Grant it necessary roles (no need for any special roles)
7. Create and download a JSON key for the service account
8. **Important**: Share your Drive portfolio folder with the service account email address, giving it "Viewer" access

### 3. Local Development

```bash
# Clone the repository
git clone https://github.com/yotamano/drive-portfolio.git
cd drive-portfolio

# Install dependencies
npm install

# Create a .env.local file with your credentials
echo "DRIVE_FOLDER_ID=your_folder_id" > .env.local
# Add the entire service account JSON (formatted as a single line)
echo "GOOGLE_SERVICE_ACCOUNT={\"type\":\"service_account\",\"project_id\":\"...\"}" >> .env.local

# Generate content from Drive (creates static JSON files)
mkdir -p public/content
npm run generate-content

# Start the development server
npm run dev
```

### 4. Deployment to GitHub Pages

1. Push your code to a GitHub repository
2. In your repository settings, add the following secrets:
   - `DRIVE_FOLDER_ID`: Your Google Drive folder ID
   - `GOOGLE_SERVICE_ACCOUNT`: The entire JSON content of your service account key file (as a single line)
3. Enable GitHub Pages for your repository, setting the source to the `gh-pages` branch
4. The GitHub Actions workflow will automatically build and deploy your site

## Customization

- **Title/Metadata**: Edit the site title and metadata in `src/pages/_app.tsx`
- **Styles**: Modify the TailwindCSS theme in `tailwind.config.js`
- **Layout**: Adjust the layout in `src/components/Layout.tsx`

## License

MIT 