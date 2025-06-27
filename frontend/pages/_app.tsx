import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Sentinel - On-chain Threat Intelligence Platform</title>
        <meta name="description" content="Next-generation on-chain analytics platform for proactive threat intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Sentinel - On-chain Threat Intelligence" />
        <meta property="og:description" content="Proactive threat intelligence for Web3 security researchers and developers" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sentinel-platform.com" />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sentinel - On-chain Threat Intelligence" />
        <meta name="twitter:description" content="Proactive threat intelligence for Web3 security researchers and developers" />
        
        {/* Security Headers - Note: X-Frame-Options is set via next.config.js headers, not meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </Head>
      
      <Component {...pageProps} />
    </>
  );
} 