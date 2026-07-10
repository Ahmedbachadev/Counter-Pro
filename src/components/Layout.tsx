import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../stores/uiStore';

import NetworkBanners from './sync/NetworkBanners';
import SyncToasts from './sync/SyncToasts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-50 antialiased overflow-hidden transition-colors duration-200">
      
      <SyncToasts />
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <NetworkBanners />
        
        {/* Sticky Top Header */}
        <Header />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-gray-950/40 transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default Layout;