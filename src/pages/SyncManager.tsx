import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cloud, RefreshCw, GitMerge, Activity, 
  Settings, Server, History, ShieldAlert,
  ListTodo
} from 'lucide-react';
import { useSyncStore } from '../stores/syncStore';
import SyncOverview from '../components/sync/SyncOverview';
import SyncQueue from '../components/sync/SyncQueue';
import SyncConflicts from '../components/sync/SyncConflicts';
import SyncHistory from '../components/sync/SyncHistory';
import SyncDiagnostics from '../components/sync/SyncDiagnostics';
import SyncRecovery from '../components/sync/SyncRecovery';
import { mockConflicts } from '../components/sync/mockData';

type Tab = 'overview' | 'queue' | 'conflicts' | 'history' | 'diagnostics' | 'recovery' | 'settings';

const SyncManager: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { isOnline, isSyncing, requestManualSync } = useSyncStore();

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cloud className="h-7 w-7 text-blue-500" />
            Synchronization Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage your offline queue, resolve conflicts, and maintain database health.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={requestManualSync}
            disabled={!isOnline || isSyncing}
            className="btn-primary px-4 py-2 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/50 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible scrollbar-none">
          <div className="p-4 hidden md:block">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Management</h2>
          </div>
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-1 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-3 transition-colors ${
              activeTab === 'overview' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Activity className="h-4 w-4" /> Overview
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-1 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-3 transition-colors ${
              activeTab === 'queue' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <ListTodo className="h-4 w-4" /> Pending Operations
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-1 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center justify-between transition-colors ${
              activeTab === 'conflicts' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <GitMerge className="h-4 w-4" /> Conflicts
            </div>
            {mockConflicts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-[10px] font-bold">
                {mockConflicts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-4 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-3 transition-colors ${
              activeTab === 'history' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <History className="h-4 w-4" /> Sync History
          </button>

          <div className="p-4 hidden md:block border-t border-slate-200 dark:border-gray-800 mt-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System</h2>
          </div>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-1 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-3 transition-colors ${
              activeTab === 'diagnostics' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Server className="h-4 w-4" /> Diagnostics
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-1 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-3 transition-colors ${
              activeTab === 'recovery' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Recovery Tools
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 md:py-2.5 mx-2 md:mx-3 md:mb-4 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-3 transition-colors ${
              activeTab === 'settings' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Settings className="h-4 w-4" /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 bg-white dark:bg-gray-900 overflow-y-auto">
          {activeTab === 'overview' && <SyncOverview />}
          {activeTab === 'queue' && <SyncQueue />}
          {activeTab === 'conflicts' && <SyncConflicts />}
          {activeTab === 'history' && <SyncHistory />}
          {activeTab === 'diagnostics' && <SyncDiagnostics />}
          {activeTab === 'recovery' && <SyncRecovery />}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Automation Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Auto Sync Enabled</p>
                      <p className="text-xs text-slate-500 mt-1">Automatically synchronize in the background when online.</p>
                    </div>
                    <div className="w-11 h-6 bg-blue-600 rounded-full relative shadow-inner">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </label>
                  
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Background Sync Interval</p>
                    <select className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors">
                      <option>Every 1 minute</option>
                      <option>Every 5 minutes</option>
                      <option>Every 15 minutes</option>
                      <option>Manual only</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Upload Batch Size</p>
                    <select className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors">
                      <option>50 records (Recommended)</option>
                      <option>100 records</option>
                      <option>500 records</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncManager;
