import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import { PortfolioData, ContentItem } from '../types';

function MyApp({ Component, pageProps }: AppProps<{ portfolioData: PortfolioData, content?: ContentItem }>) {
  const { portfolioData, content } = pageProps;
  const title = content?.name;

  return (
    <Layout portfolioData={portfolioData} title={title}>
      <Component {...pageProps} content={content} />
    </Layout>
  );
}

export default MyApp; 