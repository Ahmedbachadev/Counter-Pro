import React, { useState, useRef, useEffect } from 'react';
import { useSyncStore } from '../../stores/syncStore';
import SyncDropdown from './SyncDropdown';

const SyncIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { isOnline, isSyncing, queueStats } = useSyncStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine indicator color
  let statusColor = 'bg-emerald-500'; // Synced
  if (!isOnline) {
    statusColor = 'bg-slate-400'; // Offline
  } else if (queueStats.failed > 0) {
    statusColor = 'bg-red-500'; // Error
  } else if (isSyncing) {
    statusColor = 'bg-blue-500 animate-pulse'; // Syncing
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-gray-850 transition-colors focus:outline-none ${isOpen ? 'bg-slate-50 dark:bg-gray-850 border-slate-200 dark:border-gray-800' : ''}`}
        aria-label="Sync Status"
      >
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 tracking-wide uppercase hidden sm:block">
          {!isOnline ? 'Offline' : isSyncing ? 'Syncing' : queueStats.failed > 0 ? 'Failed' : 'Synced'}
        </span>
      </button>

      {isOpen && <SyncDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default SyncIndicator;
