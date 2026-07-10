import React, { useState } from 'react';
import { Database, ShieldCheck, History, Settings as SettingsIcon, AlertOctagon, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BackupOverview from '../components/backup/BackupOverview';
import BackupHistory from '../components/backup/BackupHistory';
import RestoreWizard from '../components/backup/RestoreWizard';
import RecoveryMode from '../components/backup/RecoveryMode';
import BackupSettings from '../components/backup/BackupSettings';
import { useBackupStore } from '../stores/backupStore';

const BackupManager: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'recovery' | 'settings'>('overview');
  const { wizardState } = useBackupStore();

  const renderTabContent = () => {
    if (wizardState.isOpen) {
      return <RestoreWizard />;
    }

    switch (activeTab) {
      case 'overview':
        return <BackupOverview />;
      case 'history':
        return <BackupHistory />;
      case 'recovery':
        return <RecoveryMode />;
      case 'settings':
        return <BackupSettings />;
      default:
        return <BackupOverview />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row bg-slate-50 dark:bg-gray-950">
      {/* Sidebar Navigation for Backup Center */}
      <div className="w-full md:w-64 lg:w-72 border-r border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Data Protection</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">Backup & Restore</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="space-y-6">
            <div>
              <h3 className="px-3 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Management</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'overview' && !wizardState.isOpen
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                  Protection Status
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'history' && !wizardState.isOpen
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <History className="h-4.5 w-4.5" />
                  Backup History
                </button>
              </nav>
            </div>

            <div>
              <h3 className="px-3 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">System</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('recovery')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'recovery' && !wizardState.isOpen
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertOctagon className={`h-4.5 w-4.5 ${activeTab === 'recovery' && !wizardState.isOpen ? 'text-red-600' : 'text-slate-400'}`} />
                    Recovery Mode
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'settings' && !wizardState.isOpen
                      ? 'bg-slate-200 text-slate-900 dark:bg-gray-800 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SettingsIcon className="h-4.5 w-4.5" />
                  Settings
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Wizard Indicator Sidebar Add-on */}
        {wizardState.isOpen && (
          <div className="p-4 border-t border-slate-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin-slow" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">Restore in Progress</p>
            </div>
            <p className="text-xs text-slate-500">The Restore Wizard is currently open. Please complete or cancel the process.</p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top bar for mobile only */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            {wizardState.isOpen ? 'Restore Wizard' : activeTab}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
