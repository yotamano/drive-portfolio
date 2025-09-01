import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PortfolioData, ContentItem } from '../types';

type HomeProps = {
  portfolioData: PortfolioData;
};

export default function Home({ portfolioData }: HomeProps) {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && router.asPath === '/') {
      // Find the first available page or project to display
      const findFirstDisplayableItem = (items: ContentItem[]): ContentItem | null => {
        for (const item of items) {
          if (item.type === 'page' || item.type === 'project') {
            return item;
          }
          if (item.children) {
            const firstChild = findFirstDisplayableItem(item.children);
            if (firstChild) {
              return firstChild;
            }
          }
        }
        return null;
      };

      const firstItem = findFirstDisplayableItem(portfolioData.root?.children || []);

      if (firstItem) {
        router.replace(firstItem.path);
      }
    }
  }, [router.isReady, router.asPath, portfolioData]);

  // This component will effectively just handle the initial redirect,
  // so it doesn't need to render anything itself.
  return null;
}

export async function getStaticProps() {
  const fs = require('fs');
  const path = require('path');
  const contentPath = path.join(process.cwd(), 'public', 'content', 'content.json');
  
  let portfolioData: PortfolioData | null = null;
  try {
    const contentJson = fs.readFileSync(contentPath, 'utf8');
    portfolioData = JSON.parse(contentJson);
  } catch (error) {
    console.error('Could not read portfolio content.json:', error);
  }

  // If data couldn't be loaded, pass a default structure to avoid breaking the page
  if (!portfolioData) {
    portfolioData = {
      root: {
        id: 'root',
        name: 'root',
        path: '/',
        type: 'folder',
        children: []
      },
      lastFetch: ''
    };
  }

  return {
    props: {
      portfolioData,
    },
  };
} 