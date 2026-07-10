import React from 'react';
import { ShieldAlert, RefreshCcw, Wrench, Trash2, DatabaseZap, Power, CheckCircle, Database } from 'lucide-react';

const SyncRecovery: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Wrench className="h-5 w-5 text-amber-500" /> Self Repair Tools
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
          Advanced tools to repair corrupted data, rebuild structures, and resolve critical synchronization blockers. 
          Use these options carefully.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                <DatabaseZap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Repair Database</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">Runs PRAGMA integrity_check, vacuums the database, and attempts to recover lost data blocks.</p>
                <button className="text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors w-full">
                  Start Repair
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Rebuild Indexes</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">Drops and recreates all database indexes. Fixes performance issues and corrupted search capabilities.</p>
                <button className="text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors w-full">
                  Rebuild
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg">
                <RefreshCcw className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Repair Queue</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">Scans the sync queue for orphaned operations, circular dependencies, and malformed payloads.</p>
                <button className="text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors w-full">
                  Fix Queue
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Clear Temporary Data</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">Deletes cached downloads, partial sync states, and local logs. Data will not be lost.</p>
                <button className="text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors w-full flex items-center justify-center gap-1.5">
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <ShieldAlert className="h-5 w-5 text-red-500" /> Critical Actions
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          Actions that forcefully manipulate the synchronization engine's state.
        </p>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Restart Sync Engine</h4>
                <p className="text-xs text-slate-500 mt-0.5">Gracefully stops and restarts the background sync process.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">
                <Power className="h-4 w-4" /> Restart
              </button>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Retry All Failed Operations</h4>
                <p className="text-xs text-slate-500 mt-0.5">Resets the retry counter and attempts to sync all failed queue items immediately.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-semibold transition-colors">
                <RefreshCcw className="h-4 w-4" /> Retry All
              </button>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors bg-red-50/30 dark:bg-red-900/5">
              <div>
                <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Reinitialize Sync (Hard Reset)</h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">Clears the entire local queue and performs a full initial sync from the cloud. Unsynced local data will be LOST.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold shadow-sm transition-colors">
                Hard Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncRecovery;
