import React from 'react';
import { ShieldAlert, DatabaseZap, Camera, ArrowLeftRight, UploadCloud, DownloadCloud, AlertOctagon } from 'lucide-react';
import { useBackupStore } from '../../stores/backupStore';

const RecoveryMode: React.FC = () => {
  const { openRestoreWizard } = useBackupStore();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <AlertOctagon className="h-5 w-5 text-red-500" /> Emergency Recovery
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
          Tools for handling critical database corruption or system failures. These actions bypass standard safety checks.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-10"></div>
            <div className="flex items-start gap-4 z-10 relative">
              <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-lg">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Auto-Detect Corruption</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">Scans the SQLite database for malformed blocks and structural corruption.</p>
                <button className="text-xs font-semibold px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full">
                  Run Deep Scan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                <DatabaseZap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Force Restore Latest</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">Immediately overwrites the current database with the last known good backup.</p>
                <button onClick={() => openRestoreWizard()} className="text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg transition-colors w-full">
                  Launch Wizard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Camera className="h-5 w-5 text-purple-500" /> Database Snapshots
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          Create instant, lightweight point-in-time snapshots before performing risky operations.
        </p>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create Pre-Migration Snapshot</h4>
                <p className="text-xs text-slate-500 mt-0.5">Recommended before updating the application to a new version.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">
                <Camera className="h-4 w-4" /> Snapshot
              </button>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create Pre-Import Snapshot</h4>
                <p className="text-xs text-slate-500 mt-0.5">Recommended before importing large CSV files for Inventory or Customers.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">
                <Camera className="h-4 w-4" /> Snapshot
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-slate-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <ArrowLeftRight className="h-5 w-5 text-emerald-500" /> Workspace Migration
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          Export the current workspace data to migrate to another device, or import an existing workspace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl transition-all group">
            <div className="p-3 bg-slate-50 dark:bg-gray-800 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 rounded-lg transition-colors">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Export Workspace</h4>
              <p className="text-xs text-slate-500 mt-0.5">Pack data into a .cpds file</p>
            </div>
          </button>
          
          <button className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl transition-all group">
            <div className="p-3 bg-slate-50 dark:bg-gray-800 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 rounded-lg transition-colors">
              <DownloadCloud className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Import Workspace</h4>
              <p className="text-xs text-slate-500 mt-0.5">Load data from a .cpds file</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryMode;
