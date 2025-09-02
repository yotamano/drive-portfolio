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
  const contentPath = path.join(process.cwd(), 'public', 'content', 'content.json');
  let portfolioData: PortfolioData | null = null;
  try {
    const contentJson = fs.readFileSync(contentPath, 'utf8');
    portfolioData = JSON.parse(contentJson);
  } catch (error) {
    console.error(`Could not read content.json for paths: ${error}`);
  }

  const getPaths = (item: ContentItem): { params: { path: string[] } }[] => {
    let paths: { params: { path: string[] } }[] = [];
    if (item.path !== '/' && item.type !== 'project') { // Don't create a path for the root itself or for projects
        paths.push({ params: { path: item.path.split('/').filter(Boolean) } });
    }
    
    if (item.children) {
      for (const child of item.children) {
        paths = paths.concat(getPaths(child));
      }
    }
    return paths;
  };

  const paths = portfolioData ? getPaths(portfolioData.root) : [];

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { path: string[] } }) {
  const fs = require('fs');
  const path = require('path');

  const contentPath = path.join(process.cwd(), 'public', 'content', 'content.json');
  let portfolioData: PortfolioData | null = null;
  try {
    const contentJson = fs.readFileSync(contentPath, 'utf8');
    portfolioData = JSON.parse(contentJson);
  } catch (error) {
    console.error(`Could not read portfolio content.json for props: ${error}`);
  }

  const currentPath = '/' + (params?.path?.join('/') || '');
  
  const findContent = (item: ContentItem): ContentItem | null => {
    if (item.path === currentPath) {
      return item;
    }
    if (item.children) {
      for (const child of item.children) {
        const found = findContent(child);
        if (found) return found;
      }
    }
    return null;
  };
  
  const content = portfolioData ? findContent(portfolioData.root) : null;

  if (!content) {
    return {
      notFound: true,
    };
  }
  
  return {
    props: {
      portfolioData,
      content,
    },
  };
} 