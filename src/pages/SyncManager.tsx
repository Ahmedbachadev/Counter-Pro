import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cloud, Database, History, Settings, RefreshCw, 
  Server, HardDrive, Wifi, WifiOff, Activity,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useSyncStore } from '../stores/syncStore';

const SyncManager: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'settings'>('queue');
  const { isOnline, isSyncing, queueStats, lastSyncedAt, requestManualSync } = useSyncStore();

  const timeAgo = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Synchronization Hub</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage your offline queue, database health, and sync settings.
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

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400'}`}>
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Network Status</p>
              <p className="text-xs text-slate-500">{isOnline ? 'Online & Connected' : 'Offline Mode'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between text-xs">
            <span className="text-slate-500">Latency</span>
            <span className="font-semibold text-slate-700 dark:text-gray-300">{isOnline ? '24ms' : 'N/A'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Cloud Status</p>
              <p className="text-xs text-slate-500">{isSyncing ? 'Synchronizing...' : 'Idle'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between text-xs">
            <span className="text-slate-500">Last Synced</span>
            <span className="font-semibold text-slate-700 dark:text-gray-300 truncate max-w-[150px]">{timeAgo}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Database Health</p>
              <p className="text-xs text-slate-500">Local SQLite (WAL mode)</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between text-xs">
            <span className="text-slate-500">Queue Size</span>
            <span className="font-semibold text-slate-700 dark:text-gray-300">{queueStats.pending} pending</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 dark:border-gray-800 flex overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'queue' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-gray-300'
            }`}
          >
            <Server className="h-4 w-4" /> Queue Viewer
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-gray-300'
            }`}
          >
            <History className="h-4 w-4" /> Sync History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-gray-300'
            }`}
          >
            <Settings className="h-4 w-4" /> Preferences
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Operations</h3>
                <button className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  Clear Failed
                </button>
              </div>

              {/* Mocked Queue Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Module</th>
                      <th className="pb-3 px-4">Operation</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Retries</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
                    {queueStats.pending === 0 && queueStats.failed === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                          <p>The queue is empty. All changes are synchronized.</p>
                        </td>
                      </tr>
                    ) : (
                      <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 pr-4 text-slate-900 dark:text-slate-200 font-medium">products</td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] font-bold">CREATE</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                            Pending
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500">0</td>
                        <td className="py-4 pl-4 text-right">
                          <button className="text-blue-600 hover:underline text-xs font-semibold mr-3">View Payload</button>
                          <button className="text-red-600 hover:underline text-xs font-semibold">Cancel</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 text-center py-10">
              <History className="h-10 w-10 mx-auto text-slate-300 dark:text-gray-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sync History</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Detailed history of past synchronization events will appear here once populated by the SyncLogger.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Automation Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Auto Sync Enabled</p>
                      <p className="text-xs text-slate-500">Automatically synchronize in the background</p>
                    </div>
                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </label>
                  
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-gray-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Sync Interval</p>
                    <select className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500">
                      <option>Every 1 minute</option>
                      <option>Every 5 minutes</option>
                      <option>Every 15 minutes</option>
                      <option>Manual only</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-gray-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Upload Batch Size</p>
                    <select className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500">
                      <option>50 records (Recommended)</option>
                      <option>100 records</option>
                      <option>500 records</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-gray-800">
                <button className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Open Database Folder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncManager;
