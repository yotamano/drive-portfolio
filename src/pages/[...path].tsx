import Link from 'next/link';
import Note from '../components/Note';
import { PortfolioData, ContentItem } from '../types';

type PathPageProps = {
  content: ContentItem;
};

export default function PathPage({ content }: PathPageProps) {
  if (!content) {
    return <div>Content not found.</div>;
  }

  // If the content is a folder, render a list of its children
  if (content.type === 'folder') {
    return (
      <>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{content.name}</h1>
          <ul>
            {(content.children || []).map(child => (
              <li key={child.id} className="mb-2">
                <Link href={child.path} className="text-blue-500 hover:underline">
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  // Otherwise, render the Note component for a project or page
  const breadcrumb = content.path.split('/').filter(Boolean).slice(0, -1);

  return (
    <>
      <Note content={content} breadcrumb={breadcrumb.join(' / ')} />
    </>
  );
}

export async function getStaticPaths() {
  const fs = require('fs');
  const path = require('path');
  const structurePath = path.join(process.cwd(), 'public', 'content', 'structure.json');
  let portfolioData: PortfolioData = { tree: [] };
  try {
    const structureJson = fs.readFileSync(structurePath, 'utf8');
    portfolioData = JSON.parse(structureJson);
  } catch (error) {
    console.error(`Could not read structure for paths: ${error}`);
  }

  const getPaths = (items: ContentItem[]): { params: { path: string[] } }[] => {
    let paths: { params: { path: string[] } }[] = [];
    for (const item of items) {
      // Create a path for ALL items now
      paths.push({ params: { path: item.path.split('/').filter(Boolean) } });
      
      if (item.children) {
        paths = paths.concat(getPaths(item.children));
      }
    }
    return paths;
  };

  const paths = getPaths(portfolioData.tree);

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { path: string[] } }) {
  const fs = require('fs');
  const path = require('path');

  const structurePath = path.join(process.cwd(), 'public', 'content', 'structure.json');
  let portfolioData: PortfolioData = { tree: [] };
  try {
    const structureJson = fs.readFileSync(structurePath, 'utf8');
    portfolioData = JSON.parse(structureJson);
  } catch (error) {
    console.error(`Could not read portfolio structure for props: ${error}`);
  }

  const currentPath = '/' + params.path.join('/');
  const contentPath = path.join(process.cwd(), 'public', 'content', currentPath, 'index.json');
  let content: ContentItem | null = null;
  try {
    const contentJson = fs.readFileSync(contentPath, 'utf8');
    content = JSON.parse(contentJson);
  } catch (error) {
    console.error(`Could not read content for ${currentPath}: ${error}`);
  }

  return {
    props: {
      portfolioData,
      content,
    },
  };
} 