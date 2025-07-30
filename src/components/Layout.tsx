import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import { PortfolioData } from '../types';

type LayoutProps = {
  children: React.ReactNode;
  portfolioData: PortfolioData;
  title?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, portfolioData, title }) => {
  const pageTitle = title ? `${title} | Portfolio` : 'Portfolio';

  return (
    <div className="flex h-screen bg-white text-black">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Portfolio"/>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Sidebar portfolioData={portfolioData} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout; 