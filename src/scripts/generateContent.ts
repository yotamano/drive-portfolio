import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { getPortfolioData } from '../lib/driveApi';
import { ContentItem } from '../types';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const CONTENT_DIR = path.join(process.cwd(), 'public', 'content');
const LAST_FETCH_FILE = path.join(CONTENT_DIR, '.last-fetch');

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

async function enhanceContent(item: ContentItem): Promise<ContentItem> {
  console.log(`Enhancing content for: ${item.name}`);

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
      model: openai('gpt-4-turbo'),
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

async function processAndSaveItem(item: ContentItem, existingItems: ContentItem[]): Promise<ContentItem> {
  let processedItem = { ...item };

  if (processedItem.type === 'project') {
    processedItem = await enhanceContent(processedItem);
  }

  if (processedItem.children) {
    processedItem.children = await processAndSaveTree(processedItem.children, existingItems);
  }

  const itemDir = path.join(CONTENT_DIR, processedItem.path);
  ensureDirectoryExists(itemDir);
  fs.writeFileSync(path.join(itemDir, 'index.json'), JSON.stringify(processedItem, null, 2));
  
  return processedItem;
}

async function processAndSaveTree(items: ContentItem[], existingItems: ContentItem[]): Promise<ContentItem[]> {
    const updatedItems = [];

    for (const item of items) {
        // Simple merge for now: if item exists, it gets replaced.
        // A more sophisticated merge could be implemented here if needed.
        updatedItems.push(await processAndSaveItem(item, existingItems));
    }
    
    // This logic needs to be smarter to handle removals.
    // For now, we are only adding/updating.
    return updatedItems;
}


async function generateContent() {
  console.log('Generating content from Google Drive...');
  ensureDirectoryExists(CONTENT_DIR);

  const lastFetch = readLastFetch();
  console.log(lastFetch ? `Fetching updates since ${lastFetch}` : 'Performing a full fetch.');

  const data = await getPortfolioData(lastFetch);
  
  const structurePath = path.join(CONTENT_DIR, 'structure.json');
  let existingStructure: { tree: ContentItem[] } = { tree: [] };
  if (lastFetch && fs.existsSync(structurePath)) {
    try {
        existingStructure = JSON.parse(fs.readFileSync(structurePath, 'utf-8'));
    } catch (e) {
        console.error("Could not parse existing structure.json. Performing a full fetch.");
        existingStructure = { tree: [] };
    }
  }

  const updatedTree = await processAndSaveTree(data.tree, existingStructure.tree);
  
  // Naive merge. A better approach would be to recursively merge the trees.
  const finalTree = { tree: updatedTree };

  fs.writeFileSync(structurePath, JSON.stringify(finalTree, null, 2));

  writeLastFetch();
  console.log('Content generation complete!');
}

if (require.main === module) {
  generateContent().catch(console.error);
}

export { generateContent }; 