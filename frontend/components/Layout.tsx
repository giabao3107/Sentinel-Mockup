import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Shield, Github, Twitter, Network, Brain, Globe, Mail, ExternalLink, BookOpen, Users, Zap, AlertCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  
  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Network },
    { href: '/graph', label: 'Graph Analysis', icon: Brain },
    { href: '/gnn', label: 'AI/GNN', icon: Brain, isNew: true },
    { href: '/social', label: 'Social Intel', icon: Globe },
    { href: '/alerts', label: 'Alerts', icon: AlertCircle },
    { href: '/docs', label: 'Documentation', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Enhanced Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-lg blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Sentinel</span>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  Enhanced
                </span>
              </div>
            </Link>

            {/* Enhanced Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                const isGNN = item.href === '/gnn';
                
                return (
              <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 font-medium transition-colors relative ${
                      active 
                        ? isGNN ? 'text-purple-600' : 'text-blue-600'
                        : isGNN ? 'text-purple-600 hover:text-purple-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.isNew && (
                      <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        NEW
                      </span>
                    )}
                    {active && (
                      <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        isGNN ? 'bg-purple-600' : 'bg-blue-600'
                      }`}></div>
                    )}
              </Link>
                );
              })}
            </nav>

            {/* Enhanced Action buttons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
              <a
                href="https://github.com/giabao3107/Sentinel_Mockup.git"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com/sentinel_web3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Brand Section */}
            <div className="lg:col-span-5">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-30"></div>
                  <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Sentinel Enhanced</h2>
                  <p className="text-blue-300 text-sm">Phase 2 Threat Intelligence Platform</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-md">
                The most comprehensive blockchain threat intelligence platform, powered by advanced 
                graph analysis, social intelligence, and real-time monitoring.
              </p>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300 text-sm font-medium">Phase 2 Active</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 text-sm font-medium">Production Ready</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-300 text-sm font-medium">AI Powered</span>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a
                    href="https://github.com/giabao3107/Sentinel_Mockup.git"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                  <a
                    href="https://twitter.com/sentinel_web3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="mailto:contact@sentinel-platform.io"
                    className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Email"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <Network className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/graph" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <Brain className="h-4 w-4 mr-2" />
                    Graph Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/social" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <Globe className="h-4 w-4 mr-2" />
                    Social Intel
                  </Link>
                </li>
                <li>
                  <Link href="/alerts" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Alert System
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-6">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/docs" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="flex items-center text-gray-300 hover:text-white transition-colors">
                    <Zap className="h-4 w-4 mr-2" />
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Technology & Features */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold mb-6">Enhanced Features</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <div className="flex items-center mb-2">
                    <Network className="h-5 w-5 mr-2 text-blue-400" />
                    <h4 className="font-medium">Graph Visualization</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Interactive Vis.js network analysis with PostgreSQL backend</p>
                </div>
                
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 mr-2 text-purple-400" />
                    <h4 className="font-medium">AI Risk Scoring</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Machine learning powered threat detection and behavioral analysis</p>
                </div>
                
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <div className="flex items-center mb-2">
                    <Globe className="h-5 w-5 mr-2 text-green-400" />
                    <h4 className="font-medium">Social Intelligence</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Off-chain data correlation from social media and reputation systems</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-6">
                <p className="text-gray-400 text-sm text-center lg:text-left">
                  Sentinel v2.0.0-enhanced
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Open Source
                  </span>
                  <span>•</span>
                  <span>Security First</span>
                  <span>•</span>
                  <span>Community Driven</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Use
                </Link>
                <Link href="/security" className="hover:text-white transition-colors">
                  Security
                </Link>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                Built for Next-Generation Web3 Security • Use at your own risk and always verify results independently
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 