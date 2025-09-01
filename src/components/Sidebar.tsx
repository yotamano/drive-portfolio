import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ContentItem, PortfolioData } from '../types';

type SidebarProps = {
  portfolioData?: PortfolioData;
};

const Sidebar: React.FC<SidebarProps> = ({ portfolioData }) => {
  const router = useRouter();

  const renderContentItem = (item: ContentItem, level: number = 0) => {
    const isActive = router.asPath === item.path;
    const isExpanded = router.asPath.startsWith(item.path);
    const paddingLeft = `${1 + level * 1.5}rem`;

    return (
      <div key={item.id}>
        <Link
          href={item.path}
          className={`block w-full text-left px-4 py-2 text-sm ${
            isActive
              ? 'bg-yellow-200 text-black'
              : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft }}
        >
          {item.name}
        </Link>
        {item.type !== 'page' && isExpanded && item.children && (
          <div className="pt-1">
            {item.children.map(child => renderContentItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="p-4">
      {(portfolioData?.root?.children || []).map(item => renderContentItem(item))}
    </div>
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Portfolio</h1>
      </div>
      <nav className="py-4">
        {sidebarContent}
      </nav>
    </aside>
  );
};

export default Sidebar; 