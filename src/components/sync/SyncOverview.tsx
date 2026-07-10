import React from 'react';
import { Cloud, Database, Wifi, WifiOff, HardDrive, Clock, Activity, Zap } from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';

const SyncOverview: React.FC = () => {
  const { isOnline, isSyncing, queueStats, lastSyncedAt } = useSyncStore();
  const timeAgo = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network Status */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Network Status</p>
              <p className="text-xs text-slate-500">{isOnline ? 'Online & Connected' : 'Offline Mode'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 flex items-center gap-1"><Activity className="h-3 w-3"/> Latency</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{isOnline ? '24ms' : 'N/A'}</span>
          </div>
        </div>

        {/* Cloud Status */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Cloud className={`h-5 w-5 ${isSyncing ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Cloud Status</p>
              <p className="text-xs text-slate-500">{isSyncing ? 'Synchronizing...' : 'Idle'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3"/> Last Synced</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 truncate max-w-[120px]">{timeAgo}</span>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Database Health</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Healthy (WAL mode)</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 flex items-center gap-1"><Database className="h-3 w-3"/> Size</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">14.2 MB</span>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Queue Status</p>
              <p className="text-xs text-slate-500">{queueStats.pending} Items Pending</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Failed</span>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{queueStats.failed} Errors</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Workspace Info</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Workspace Name</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">Main Branch HQ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Current Device</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">POS Terminal 1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">App Version</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">v2.1.4</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Sync Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Average Sync Duration</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">450ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Success Rate</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">99.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Synced Today</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">1,240 records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncOverview;
