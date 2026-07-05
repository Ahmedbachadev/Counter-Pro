import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { ChevronRight } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Simple Breadcrumb logic
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-[#0d1117] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-30 transform lg:static lg:translate-x-0 transition duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav toggleMobileMenu={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            
            {/* Breadcrumb Navigation Placeholder */}
            <nav className="flex mb-4 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                  <span className="text-gray-400 dark:text-gray-500">Platform</span>
                </li>
                {pathnames.slice(1).map((value, index) => {
                  const isLast = index === pathnames.length - 2;
                  const label = value.charAt(0).toUpperCase() + value.slice(1);
                  return (
                    <li key={value} className="flex items-center">
                      <ChevronRight className="w-4 h-4 mx-1" />
                      <span className={isLast ? 'text-gray-700 dark:text-gray-300 font-medium' : ''}>
                        {label.replace('-', ' ')}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* Page Content */}
            <div className="bg-white dark:bg-[#161b22] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 min-h-[500px]">
              <Outlet />
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
