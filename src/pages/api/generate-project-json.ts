import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export default async function POST(req: Request) {
  // Extract the raw content from the body of the request
  const { content } = await req.json();

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
1.  Extract or improve the project title.
2.  Write a compelling two-line excerpt that summarizes the project.
3.  Determine the best display order for all content blocks (paragraphs, images, GIFs, videos).
4.  For all media (images, GIFs, videos), write descriptive alt-text or an optional caption.
5.  Ensure the final output is a single, clean JSON object.

Here is the raw project content:
---
${content}
---

Please provide only the JSON object as the output.
`;

  const { textStream } = await streamText({
    model: openai('gpt-4-turbo'),
    prompt,
  });

  // Respond with the stream
  return new Response(textStream);
} 