import React from 'react';
import { useAuthStore } from '../stores/authStore';

import { useNavigate } from 'react-router-dom';

const WorkspaceExpired: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0d1117] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#161b22] p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
        <div className="flex justify-center">
          <div className="h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-[#161b22] shadow-sm">
            <svg className="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Access Period Expired</h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Your workspace access period has expired. Please contact your Platform Administrator or renew your subscription to restore access to your account and data.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => window.location.href = 'mailto:support@counterpro.com'}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Contact Support
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceExpired;
