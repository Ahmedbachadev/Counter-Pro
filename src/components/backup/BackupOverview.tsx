import React from 'react';
import { DatabaseBackup, HardDrive, Clock, ShieldCheck, Play, Plus } from 'lucide-react';
import { useBackupStore } from '../../stores/backupStore';

const BackupOverview: React.FC = () => {
  const { backups, settings, isCreatingBackup, setCreatingBackup } = useBackupStore();
  
  // Calculate stats from mock backups
  const lastBackup = backups.length > 0 ? backups[0] : null;
  const timeAgo = lastBackup ? new Date(lastBackup.createdAt).toLocaleString() : 'Never';
  const totalStorage = backups.reduce((acc, curr) => acc + (curr.compressedSizeBytes > 0 ? curr.compressedSizeBytes : curr.sizeBytes), 0);
  const formattedStorage = (totalStorage / (1024 * 1024)).toFixed(2) + ' MB';

  const handleManualBackup = () => {
    setCreatingBackup(true);
    setTimeout(() => setCreatingBackup(false), 3000); // Mock processing
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Backup Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">System Protected</p>
              <p className="text-xs text-slate-500">Backups are running</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3"/> Last Backup</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 truncate max-w-[120px]" title={timeAgo}>{timeAgo}</span>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Total Storage</p>
              <p className="text-xs text-slate-500">{backups.length} backups stored</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Space Used</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{formattedStorage}</span>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <DatabaseBackup className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Auto Backup</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Enabled ({settings.frequency})</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 flex items-center gap-1">Next Run</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">In 4 hours</span>
          </div>
        </div>

        {/* Retention Policy */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Retention Policy</p>
              <p className="text-xs text-slate-500">Keep Last 10 Backups</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Oldest Kept</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">3 days ago</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h4>
          <div className="space-y-4">
            <button 
              onClick={handleManualBackup}
              disabled={isCreatingBackup}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-gray-800 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {isCreatingBackup ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Create Full Backup</p>
                  <p className="text-xs text-slate-500 mt-0.5">Captures the entire database and settings.</p>
                </div>
              </div>
              <Plus className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button 
              onClick={handleManualBackup}
              disabled={isCreatingBackup}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-gray-800 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  {isCreatingBackup ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400">Create Incremental Backup</p>
                  <p className="text-xs text-slate-500 mt-0.5">Saves only data changed since the last backup.</p>
                </div>
              </div>
              <Plus className="h-5 w-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Latest Backup Details</h4>
          {lastBackup ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-gray-800">
                <span className="text-sm text-slate-500">Backup Type</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{lastBackup.type}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-gray-800">
                <span className="text-sm text-slate-500">Total Records</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{lastBackup.totalRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-gray-800">
                <span className="text-sm text-slate-500">Compression</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {lastBackup.compressedSizeBytes > 0 ? `${((1 - lastBackup.compressedSizeBytes / lastBackup.sizeBytes) * 100).toFixed(0)}% Smaller` : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-gray-800">
                <span className="text-sm text-slate-500">Duration</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{(lastBackup.durationMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Verification</span>
                <span className={`text-sm font-medium ${lastBackup.verificationPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {lastBackup.verificationPassed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <ShieldCheck className="h-8 w-8 mb-2 opacity-30" />
              <p>No backups available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupOverview;
