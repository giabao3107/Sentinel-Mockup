import Head from 'next/head';
import Layout from '@/components/Layout';
import GNNDashboard from '@/components/GNNDashboard';

export default function GNNPage() {
  return (
    <Layout>
      <Head>
        <title>AI-Powered GNN Analysis - Sentinel</title>
        <meta name="description" content="Advanced threat detection using Graph Neural Networks and PyTorch AI models" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <GNNDashboard />
      </div>
    </Layout>
  );
} 