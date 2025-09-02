import React from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import { PortfolioData } from '../types';

type LayoutProps = {
  children: React.ReactNode;
  portfolioData: PortfolioData | null;
  title?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, portfolioData, title }) => {
  const siteTitle = title ? `${title} — Yotam's Portfolio` : "Yotam's Portfolio";

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content="A portfolio of design and development work." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="main-layout">
        {/* <Sidebar portfolioData={portfolioData} /> */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout; 