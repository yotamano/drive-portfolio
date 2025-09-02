import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { getPortfolioData } from '../lib/driveApi';
import { ContentItem } from '../types';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { MediaFile } from '../types';


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CONTENT_DIR = path.join(process.cwd(), 'public', 'content');
const MANIFEST_FILE = path.join(CONTENT_DIR, '.asset-manifest.json');

type ManifestSuccessEntry = {
  status: 'success';
  cloudinaryPublicId: string;
  driveModifiedTime: string;
  cloudinaryUrl: string;
  width?: number;
  height?: number;
};

type ManifestFailureEntry = {
  status: 'failed';
  driveModifiedTime: string;
  failureReason: string;
};

type AssetManifest = {
  [driveId: string]: ManifestSuccessEntry | ManifestFailureEntry;
};

const ERROR_LOG_FILE = path.join(process.cwd(), '.upload-errors.log');


// Load or initialize the asset manifest
function loadManifest(): AssetManifest {
  if (fs.existsSync(MANIFEST_FILE)) {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  }
  return {};
}

// Save the asset manifest
function saveManifest(manifest: AssetManifest) {
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

// Function to upload a file to Cloudinary from a stream
async function uploadToCloudinary(driveFile: any, parentPath: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const nameWithoutExtension = driveFile.name.lastIndexOf('.') > 0 
      ? driveFile.name.substring(0, driveFile.name.lastIndexOf('.')) 
      : driveFile.name;
      
    // Sanitize for characters that are problematic in URLs/public_ids
    const sanitizedName = nameWithoutExtension.replace(/&/g, 'and').replace(/[/\\?%*:|"<>]/g, '-');

    const public_id = `${parentPath}/${sanitizedName}`;

    const downloader = await axios({
      url: `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`,
      method: 'GET',
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${await getDriveAuthToken()}`,
      },
    });

    const upload_stream = cloudinary.uploader.upload_stream(
      {
        public_id,
        resource_type: driveFile.mimeType.startsWith('video') ? 'video' : 'image',
        overwrite: true,
        folder: 'drive-portfolio', // Optional: organize in a folder in Cloudinary
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    downloader.data.pipe(upload_stream);
  });
}

// Helper to get an auth token for Drive API calls
async function getDriveAuthToken() {
    const auth = new (require('google-auth-library').GoogleAuth)({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
}


const LAST_FETCH_FILE = path.join(CONTENT_DIR, '.last-fetch');

// Helper function to analyze image dimensions and make layout decisions
function analyzeImageLayout(images: MediaFile[]) {
  if (!images) return { groups: [], stats: { total: 0, vertical: 0, horizontal: 0, square: 0 } };
  
  // Analyze each image
  const imageAnalysis = images.map(img => {
    const width = img.width || 1;
    const height = img.height || 1;
    const aspectRatio = width / height;
    const isVertical = aspectRatio < 0.8; // More vertical than 4:5
    const isHorizontal = aspectRatio > 1.3; // More horizontal than 4:3
    const isSquareish = !isVertical && !isHorizontal;
    
    return {
      ...img,
      width,
      height,
      aspectRatio,
      isVertical,
      isHorizontal,
      isSquareish,
      category: isVertical ? 'vertical' : isHorizontal ? 'horizontal' : 'square'
    };
  });
  
  // Group images by category and make layout decisions
  const verticalImages = imageAnalysis.filter(img => img.isVertical);
  const horizontalImages = imageAnalysis.filter(img => img.isHorizontal);
  const squareImages = imageAnalysis.filter(img => img.isSquareish);
  
  // Smart layout decisions based on content analysis
  const layoutGroups = [];
  
  // If we have 2-4 vertical images (like phone mockups), group them in pairs
  if (verticalImages.length >= 2 && verticalImages.length <= 4) {
    for (let i = 0; i < verticalImages.length; i += 2) {
      const pair = verticalImages.slice(i, i + 2);
      layoutGroups.push({
        images: pair,
        layout: 'two-column' as const,
        reason: `Vertical images ${pair.length === 2 ? 'pair' : 'group'} (${pair.map(img => `${img.width}x${img.height}`).join(', ')})`
      });
    }
  }
  
  // Handle remaining images
  const processedIds = new Set(layoutGroups.flatMap(group => group.images.map(img => img.id)));
  const remainingImages = imageAnalysis.filter(img => !processedIds.has(img.id));
  
  // Single column for horizontal images or mixed groups
  if (remainingImages.length > 0) {
    layoutGroups.push({
      images: remainingImages,
      layout: 'single-column' as const,
      reason: `${remainingImages.length} remaining images (mixed or horizontal)`
    });
  }
  
  return {
    groups: layoutGroups,
    stats: {
      total: images.length,
      vertical: verticalImages.length,
      horizontal: horizontalImages.length,
      square: squareImages.length
    }
  };
}

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readLastFetch(): string | null {
  if (fs.existsSync(LAST_FETCH_FILE)) {
    return fs.readFileSync(LAST_FETCH_FILE, 'utf-8');
  }
  return null;
}

function writeLastFetch() {
  fs.writeFileSync(LAST_FETCH_FILE, new Date().toISOString());
}

// Generate zoom-level content for the portfolio
async function generateZoomContent(projects: ContentItem[]): Promise<any> {
  console.log('Generating zoom-level content structure...');

  const projectsContent = projects.map(project => {
    const mediaNames = (project.mediaFiles || []).map(f => f.name).join(', ');
    return {
      name: project.name,
      content: project.content || '',
      mediaFiles: mediaNames,
      path: project.path
    };
  }).slice(0, 6); // Limit to first 6 projects for the prompt

  const prompt = `
You are creating content for a zoom-based portfolio website with 4 levels. Please generate structured content following these exact rules:

ZOOM LEVEL RULES:
- L0: Site header (≤90 chars): "Hi, I'm Yotam — designer working with AI and the web."
- L1: Index rows (≤140 chars each): Title (year) [medium] [Role] - all 3 properties are optional if applicable. No adjectives.
- L2: Project card (25-45 words): What it is, for whom, how it works. One sentence.
- L3: Full case (max 3 short paragraphs): Problem, solution, result.

PROJECTS TO PROCESS:
${JSON.stringify(projectsContent, null, 2)}

Return a JSON object with this exact structure:
{
  "siteHeader": "Hi, I'm Yotam — designer working with AI and the web.",
  "projects": [
    {
      "id": "project-path",
      "l1": "Project Title (2024) Web Development Technical Lead",
      "l2": "One compelling sentence describing what it is, for whom, and how it works in 25-45 words.",
      "l3": {
        "problem": "Brief paragraph about the problem or challenge",
        "solution": "Brief paragraph about the approach and solution", 
        "result": "Brief paragraph about the outcome and impact"
      },
      "year": "2024",
      "medium": "Web Development",
      "role": "Technical Lead"
    }
  ]
}

IMPORTANT:
- Extract real years from content when possible, omit if not available
- Infer medium from project content (Web Development, UX Design, AI Tool, etc.) - omit if unclear
- Infer role from content (Technical Lead, Designer, Creator, etc.) - omit if unclear
- L1 format: "Title (year) [medium] [Role]" where year, medium, and role are optional
- L2 must be exactly one sentence, 25-45 words
- L3 paragraphs should be 2-3 sentences each
- Use the project's actual path as the id

Please provide only the JSON object as output.
`;

  try {
    const { textStream } = await streamText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    let jsonString = '';
    for await (const delta of textStream) {
      jsonString += delta;
    }

    const cleanJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJsonString);
  } catch (error) {
    console.error('Error generating zoom content:', error);
    // Return fallback structure
    return {
      siteHeader: "Hi, I'm Yotam — designer working with AI and the web.",
      projects: projects.slice(0, 6).map((project, index) => ({
        id: project.path,
        l1: `${project.name} (2024) Web Development Technical Lead`,
        l2: `Interactive experience built with modern web technologies for creative professionals.`,
        l3: {
          problem: "Traditional portfolio websites lack engaging interaction patterns.",
          solution: "Built an innovative zoom-based navigation system with seamless transitions.",
          result: "Created an immersive experience that feels like AI-generated content expansion."
        },
        year: "2024",
        medium: "Web Development", 
        role: "Technical Lead"
      }))
    };
  }
}

async function enhanceContent(item: ContentItem): Promise<ContentItem> {
  console.log(`Enhancing content for: ${item.name}`);

  // ANALYZE LAYOUT AT BUILD TIME
  if (item.mediaFiles && item.mediaFiles.length > 0) {
    const images = item.mediaFiles.filter(m => m.mimeType.startsWith('image/'));
    
    console.log(`Analyzing layout for ${item.name} - ${images.length} images`);
    console.log('Image dimensions:', images.map(img => ({
      name: img.name,
      width: img.width,
      height: img.height,
      hasNoDimensions: !img.width || !img.height
    })));
    
    // Smart layout analysis (moved from runtime to build time)
    const layoutAnalysis = analyzeImageLayout(images);
    
    // Store layout decisions in the content item
    item.layoutConfig = {
      groups: layoutAnalysis.groups,
      stats: layoutAnalysis.stats
    };
    
    console.log(`Layout analysis for ${item.name}:`, {
      groups: layoutAnalysis.groups.map(g => ({
        layout: g.layout,
        imageCount: g.images.length,
        reason: g.reason
      })),
      stats: layoutAnalysis.stats
    });
  }

  let contentForPrompt = item.content || '';

  if (!contentForPrompt) {
    const mediaNames = (item.mediaFiles || []).map(f => f.name).join(', ');
    if (mediaNames) {
      contentForPrompt = `Project titled "${item.name}" with media files: ${mediaNames}`;
    } else {
      // No content and no media, just use the name
      contentForPrompt = `Project titled "${item.name}"`;
    }
  }

  const prompt = `
Given the following raw project content, please process it and return a clean JSON payload.

The JSON payload should have the following structure:
{
  "title": "string (extracted or improved project title)",
  "excerpt": "string (a compelling two-line excerpt)",
  "date": "string (date of the project, if available, in YYYY-MM-DD format)",
  "bodyBlocks": [
    {
      "type": "paragraph",
      "content": "string"
    },
    {
      "type": "image",
      "url": "string",
      "alt": "string (descriptive alt-text for accessibility)"
    },
    {
      "type": "video",
      "url": "string",
      "caption": "string (optional caption)"
    }
  ]
}

Here are the tasks to perform:
1. Extract or improve the project title.
2. Write a compelling two-line excerpt that summarizes the project.
3. Determine the best display order for all content blocks (paragraphs, images, GIFs, videos).
4. For all media (images, GIFs, videos), write descriptive alt-text or an optional caption.
5. Ensure the final output is a single, clean JSON object.

Here is the raw project content:
---
${contentForPrompt}
---

Please provide only the JSON object as the output.
`;

  try {
    const { textStream } = await streamText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    let jsonString = '';
    for await (const delta of textStream) {
      jsonString += delta;
    }

    const cleanJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const enhancedData = JSON.parse(cleanJsonString);

    return {
      ...item,
      name: enhancedData.title || item.name,
      excerpt: enhancedData.excerpt || item.excerpt,
      // You can now also populate the body with structured content from the LLM
      // content: JSON.stringify(enhancedData.bodyBlocks),
    };
  } catch (error) {
    console.error(`Error enhancing content for ${item.name}:`, error);
    return {
      ...item,
      excerpt: item.content ? item.content.substring(0, 150).replace(/\\n/g, ' ') + '...' : `A project named ${item.name}.`,
    };
  }
}

async function processItem(item: ContentItem, manifest: AssetManifest, seenDriveIds: Set<string>, errorLog: fs.WriteStream) {
  // First, recursively process all children so we have their data
  if (item.children) {
    for (const child of item.children) {
      await processItem(child, manifest, seenDriveIds, errorLog);
    }
  }

  // Now, handle the media files for the current item
  if (item.mediaFiles) {
    const processedMediaFiles: MediaFile[] = [];
    for (const mediaFile of item.mediaFiles) {
      seenDriveIds.add(mediaFile.id);
      const manifestEntry = manifest[mediaFile.id];
      const hasChanged = !manifestEntry || manifestEntry.driveModifiedTime !== mediaFile.modifiedTime;

      if (hasChanged) {
        console.log(`Syncing: ${item.path}/${mediaFile.name}`);
        try {
          const result = await uploadToCloudinary(mediaFile, item.path);
          manifest[mediaFile.id] = {
            status: 'success',
            cloudinaryPublicId: result.public_id,
            driveModifiedTime: mediaFile.modifiedTime,
            cloudinaryUrl: result.secure_url,
            width: result.width,
            height: result.height,
          };
          processedMediaFiles.push({
            ...mediaFile,
            webViewLink: result.secure_url,
            downloadLink: result.secure_url,
            thumbnailLink: result.secure_url,
            width: result.width,
            height: result.height,
          });
        } catch (error: any) {
          const errorMessage = error.message || 'Unknown error';
          console.error(`Failed to sync ${mediaFile.name}:`, errorMessage);
          errorLog.write(`File: ${item.path}/${mediaFile.name}\nReason: ${errorMessage}\n\n`);
          manifest[mediaFile.id] = {
            status: 'failed',
            driveModifiedTime: mediaFile.modifiedTime,
            failureReason: errorMessage,
          };
          // Don't add to processedMediaFiles as it failed
        }
      } else {
        if (manifestEntry.status === 'success') {
            // Unchanged and successful, use the URL from the manifest
            processedMediaFiles.push({
                ...mediaFile,
                webViewLink: manifestEntry.cloudinaryUrl,
                downloadLink: manifestEntry.cloudinaryUrl,
                thumbnailLink: manifestEntry.cloudinaryUrl,
                width: manifestEntry.width,
                height: manifestEntry.height,
            });
        } else {
            // Unchanged but failed previously. Skip upload and log.
            errorLog.write(`File (skipped): ${item.path}/${mediaFile.name}\nReason: ${manifestEntry.failureReason}\n\n`);
        }
      }
    }
    // We only include successfully processed files in the final content.json
    item.mediaFiles = processedMediaFiles;
    
    // After processing media, analyze layout
    if (item.mediaFiles.length > 0) {
        const images = item.mediaFiles.filter(m => m.mimeType.startsWith('image/'));
        item.layoutConfig = analyzeImageLayout(images);
    }
  }
}

// Helper function to find the main doc and media files in a project
function extractProjectFiles(children: ContentItem[]) {
    const doc = children.find(c => c.type === 'page');
    const mediaFiles = children.filter(c => c.type !== 'page').flatMap(c => c.mediaFiles || []);
    return { doc, mediaFiles };
}

// This function needs to be defined to get the google drive file, it can be imported from driveApi.ts or defined here
async function getGoogleDriveFile(fileId: string): Promise<any> {
    const drive = (await import('../lib/driveApi')).drive;
    const res = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, imageMediaMetadata, videoMediaMetadata',
    });
    return res.data;
}

async function main() {
  console.log('Starting content generation script...');

  // Set up the error log
  const errorLog = fs.createWriteStream(ERROR_LOG_FILE);
  errorLog.write(`Upload Error Log - ${new Date().toISOString()}\n\n`);


  const lastFetch = fs.existsSync(LAST_FETCH_FILE)
    ? fs.readFileSync(LAST_FETCH_FILE, 'utf-8')
    : null;

  console.log('Fetching portfolio data from Google Drive...');
  const portfolioData = await getPortfolioData(lastFetch);
  
  if (!portfolioData.root.children || portfolioData.root.children.length === 0) {
    console.log('No content found in Drive folder. Exiting.');
    return;
  }
  
  console.log('Syncing assets with Cloudinary...');
  const manifest = loadManifest();
  const seenDriveIds = new Set<string>();

  for (const item of portfolioData.root.children) {
    await processItem(item, manifest, seenDriveIds, errorLog);
  }

  // Pruning: Remove files from Cloudinary and manifest that are no longer in Drive
  const manifestIds = Object.keys(manifest);
  const deletedIds = manifestIds.filter(id => !seenDriveIds.has(id));

  const DANGEROUS_DELETE_THRESHOLD = 10;
  const forceDelete = process.argv.includes('--force-delete');

  if (deletedIds.length > DANGEROUS_DELETE_THRESHOLD && !forceDelete) {
    console.error(`\n\n--- SAFETY ABORT ---`);
    console.error(`The script is about to delete ${deletedIds.length} assets from Cloudinary. This seems unusually high.`);
    console.error(`This can happen if there is an error in the script or a problem connecting to Google Drive.`);
    console.error(`\nFiles that would be deleted:`);
    for (const id of deletedIds) {
      const entry = manifest[id];
      if (entry.status === 'success') {
        console.error(` - ${entry.cloudinaryPublicId}`);
      }
    }
    console.error(`\nIf this mass deletion is intentional, run the command again with the --force-delete flag.`);
    console.error(`Example: npm run build -- --force-delete`);
    process.exit(1); // Exit with an error code to stop the build
  }


  if (deletedIds.length > 0) {
    console.log(`Pruning ${deletedIds.length} deleted assets...`);
    for (const id of deletedIds) {
      const manifestEntry = manifest[id];
      if (manifestEntry.status === 'success') {
          try {
            await cloudinary.uploader.destroy(manifestEntry.cloudinaryPublicId);
            console.log(` - Deleted ${manifestEntry.cloudinaryPublicId} from Cloudinary`);
            delete manifest[id];
          } catch (error) {
            console.error(`Failed to delete ${manifestEntry.cloudinaryPublicId}:`, error);
          }
      } else {
        // If it was a failed entry, just remove it from the manifest
        delete manifest[id];
      }
    }
  }
  
  saveManifest(manifest);
  console.log('Asset manifest saved.');
  
  errorLog.end();
  // Check if error log has content other than the header
  if (fs.readFileSync(ERROR_LOG_FILE, 'utf-8').length > 50) {
      console.warn('\n--- !!! Some assets failed to upload. Check .upload-errors.log for details. !!! ---\n');
  } else {
      fs.unlinkSync(ERROR_LOG_FILE); // Clean up empty log file
  }

  // Generate zoom-level content structure
  console.log('Generating zoom-level content...');
  const projects = portfolioData.root.children?.filter(item => item.type === 'project') || [];
  const zoomContent = await generateZoomContent(projects);
  
  // Save zoom content separately for easy access
  const zoomContentPath = path.join(CONTENT_DIR, 'zoom-content.json');
  fs.writeFileSync(zoomContentPath, JSON.stringify(zoomContent, null, 2));
  console.log(`Zoom content saved to ${zoomContentPath}`);

  console.log('Saving content to JSON file...');
  const outputPath = path.join(CONTENT_DIR, 'content.json');
  fs.writeFileSync(outputPath, JSON.stringify(portfolioData, null, 2));
  fs.writeFileSync(LAST_FETCH_FILE, new Date().toISOString());

  console.log(`Content generation complete. Data saved to ${outputPath}`);
}

main().catch(console.error); 