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

      const firstItem = findFirstDisplayableItem(portfolioData.tree);

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
  const structurePath = path.join(process.cwd(), 'public', 'content', 'structure.json');
  
  let portfolioData: PortfolioData = { tree: [] };
  try {
    const structureJson = fs.readFileSync(structurePath, 'utf8');
    portfolioData = JSON.parse(structureJson);
  } catch (error) {
    console.error('Could not read portfolio structure:', error);
  }

  return {
    props: {
      portfolioData,
    },
  };
} 