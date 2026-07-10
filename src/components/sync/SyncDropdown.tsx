import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Server, UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { useNavigate } from 'react-router-dom';

interface SyncDropdownProps {
  onClose: () => void;
}

const SyncDropdown: React.FC<SyncDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { isOnline, isSyncing, progress, lastSyncedAt, queueStats, requestManualSync } = useSyncStore();

  const handleOpenManager = () => {
    navigate('/dashboard/sync');
    onClose();
  };

  const timeAgo = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never';

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-gray-900 animate-slide-in">
      {/* Header Status */}
      <div className="p-4 bg-slate-50/50 dark:bg-gray-900/50 flex items-start gap-3">
        <div className="mt-0.5">
          {!isOnline ? (
            <CloudOff className="h-5 w-5 text-slate-400" />
          ) : isSyncing ? (
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          ) : queueStats.failed > 0 ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {!isOnline ? 'Working Offline' : isSyncing ? 'Syncing...' : 'All changes synced'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isSyncing ? progress?.message || 'Synchronizing with cloud' : `Last synced: ${timeAgo}`}
          </p>
        </div>
      </div>

      {/* Progress Bar (Visible only when syncing) */}
      {isSyncing && progress && (
        <div className="p-4 pb-3">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            <span>{progress.currentModule || 'Preparing'}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex justify-between">
            <span>{progress.completedOperations} / {progress.totalOperations} records</span>
          </p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-gray-850">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Server className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <span className="text-lg font-semibold text-slate-700 dark:text-gray-200">{queueStats.pending}</span>
        </div>
        
        <div className="bg-slate-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-gray-850">
          <div className="flex items-center gap-1.5 text-red-500 mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Failed</span>
          </div>
          <span className="text-lg font-semibold text-slate-700 dark:text-gray-200">{queueStats.failed}</span>
        </div>

        <div className="bg-slate-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-gray-850">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <UploadCloud className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Uploaded</span>
          </div>
          <span className="text-lg font-semibold text-slate-700 dark:text-gray-200">{progress?.uploadCount || 0}</span>
        </div>

        <div className="bg-slate-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-gray-850">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <DownloadCloud className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Downloaded</span>
          </div>
          <span className="text-lg font-semibold text-slate-700 dark:text-gray-200">{progress?.downloadCount || 0}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-slate-50/50 dark:bg-gray-900/50 flex gap-2">
        <button 
          onClick={handleOpenManager}
          className="flex-1 py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
        >
          View Details
        </button>
        <button 
          onClick={() => { requestManualSync(); onClose(); }}
          disabled={!isOnline || isSyncing}
          className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </button>
      </div>
    </div>
  );
};

export default SyncDropdown;
