/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['drive.google.com', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // Add basePath for GitHub Pages deployment
  basePath: isProd && isGitHubPages ? '/drive-portfolio' : '',
  assetPrefix: isProd && isGitHubPages ? '/drive-portfolio' : '',
};

module.exports = nextConfig; 