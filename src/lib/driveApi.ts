import { google } from 'googleapis';
import { ContentItem, MediaFile, PortfolioData } from '../types';
import path from 'path';
import fs from 'fs';

// This would be set at build time through environment variables
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'drive-portfolio-467408-e415b2e2cd13.json');

// Initialize the Drive API client
let auth;

// Check if we have service account credentials in environment variable (GitHub Actions)
if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    console.log('Using service account from environment variable');
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
} else if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.log('Using service account from file');
    auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_FILE,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
} else {
    console.error(`Service account key file not found at: ${SERVICE_ACCOUNT_FILE} and no GOOGLE_SERVICE_ACCOUNT environment variable set`);
    // Fallback to default auth to avoid crashing, though it will likely fail.
    auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
}


export const drive = google.drive({ version: 'v3', auth });

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
  };
}

async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, imageMediaMetadata)',
      orderBy: 'folder,name',
    });
    return (res.data.files || []) as DriveFile[];
  } catch (error) {
    console.error(`Error listing files in folder ${folderId}:`, error);
    return [];
  }
}

async function getFileContent(fileId: string): Promise<string> {
  try {
    const res = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });
    return res.data as string;
  } catch (error) {
    console.error(`Error getting file content for ${fileId}:`, error);
    return '';
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function processDriveItem(
  item: DriveFile,
  parentPath: string
): Promise<ContentItem | null> {
  const itemPath = `${parentPath}/${slugify(item.name)}`;

  if (item.mimeType === 'application/vnd.google-apps.folder') {
    const children = await listFilesInFolder(item.id);
    const childItems = (
      await Promise.all(
        children.map((child) => processDriveItem(child, itemPath))
      )
    ).filter((child): child is ContentItem => child !== null);
    
    const isProject = children.every(child => child.mimeType !== 'application/vnd.google-apps.folder');

    const contentItem: ContentItem = {
      id: item.id,
      name: item.name,
      path: itemPath,
      type: isProject ? 'project' : 'folder',
      children: childItems,
    };

    if (isProject) {
        const docs = children.filter((f) => f.mimeType === 'application/vnd.google-apps.document');
        if (docs.length > 0) {
            contentItem.content = await getFileContent(docs[0].id);
        }
        contentItem.mediaFiles = children
            .filter((f) => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))
            .map((file) => ({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                webViewLink: `https://drive.google.com/uc?export=view&id=${file.id}`,
                downloadLink: `https://drive.google.com/uc?export=download&id=${file.id}`,
                embedLink: `https://drive.google.com/file/d/${file.id}/preview`,
                thumbnailLink: file.thumbnailLink,
                width: file.imageMediaMetadata?.width,
                height: file.imageMediaMetadata?.height,
                modifiedTime: file.modifiedTime,
            }));
    }


    return contentItem;
  }

  if (item.mimeType === 'application/vnd.google-apps.document') {
    return {
      id: item.id,
      name: item.name,
      path: itemPath,
      type: 'page',
      content: await getFileContent(item.id),
    };
  }

  return null;
}

export async function getPortfolioData(lastFetch: string | null = null): Promise<PortfolioData> {
  try {
    const root = await processDriveItem({
      id: DRIVE_FOLDER_ID,
      name: 'root',
      mimeType: 'application/vnd.google-apps.folder',
      modifiedTime: new Date().toISOString()
    }, '');

    if (!root) {
      return {
          root: {
              id: 'root',
              name: 'root',
              path: '/',
              type: 'folder',
              children: []
          },
          lastFetch: new Date().toISOString()
      };
    }

    return { 
      root,
      lastFetch: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting portfolio data:', error);
    return {
        root: {
            id: 'root',
            name: 'root',
            path: '/',
            type: 'folder',
            children: []
        },
        lastFetch: new Date().toISOString()
    };
  }
} 