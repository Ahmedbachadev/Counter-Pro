import React, { useState, useRef, useEffect } from 'react';
import { useSyncStore } from '../../stores/syncStore';
import SyncDropdown from './SyncDropdown';
import { Check, RefreshCw, AlertTriangle, XCircle } from 'lucide-react';

const SyncIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { isOnline, isSyncing, queueStats, pendingCount, initialSyncFailed } = useSyncStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine State
  const isFailed = queueStats.failed > 0;
  const isPending = pendingCount > 0;
  const isOffline = !isOnline;

  let content = null;

  if (initialSyncFailed) {
    content = (
      <>
        <XCircle className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-medium text-red-600 dark:text-red-400">Initial Sync Failed</span>
      </>
    );
  } else if (isFailed) {
    content = (
      <>
        <XCircle className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-medium text-red-600 dark:text-red-400">Sync Failed</span>
      </>
    );
  } else if (isSyncing) {
    content = (
      <>
        <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Syncing...</span>
      </>
    );
  } else if (isOffline) {
    content = (
      <>
        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Offline</span>
      </>
    );
  } else if (isPending) {
    content = (
      <>
        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
          Pending Sync ({pendingCount})
        </span>
      </>
    );
  } else {
    content = (
      <>
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Synced</span>
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors focus:outline-none 
          ${isOpen ? 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700' : 'border-transparent hover:bg-slate-50 dark:hover:bg-gray-800'}`}
        aria-label="Sync Status"
      >
        {content}
      </button>

      {isOpen && <SyncDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default SyncIndicator;
