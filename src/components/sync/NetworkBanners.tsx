import React, { useEffect, useState } from 'react';
import { CloudOff, CloudLightning } from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';

const NetworkBanners: React.FC = () => {
  const { isOnline, isSyncing } = useSyncStore();
  const [showReconnect, setShowReconnect] = useState(false);
  const [wasOffline, setWasOffline] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnect(false);
    } else if (wasOffline && isOnline) {
      setShowReconnect(true);
      setWasOffline(false);
      
      // Auto dismiss reconnect banner after 4 seconds if not syncing, or let sync complete handle it
      const timer = setTimeout(() => {
        setShowReconnect(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // If syncing starts while reconnect banner is showing, we can hide it because the Dropdown/Header already shows Syncing...
  // But the prompt says "Automatically dismiss after synchronization starts."
  useEffect(() => {
    if (isSyncing && showReconnect) {
      setShowReconnect(false);
    }
  }, [isSyncing, showReconnect]);

  if (!isOnline) {
    return (
      <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-sm relative z-40 text-xs">
        <CloudOff className="h-4 w-4 text-slate-300" />
        <span className="font-semibold">Working Offline.</span>
        <span className="text-slate-300 hidden sm:inline">Your changes are saved locally and will sync automatically once restored.</span>
      </div>
    );
  }

  if (showReconnect && !isSyncing) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-sm relative z-40 text-xs animate-slide-in">
        <CloudLightning className="h-4 w-4" />
        <span className="font-semibold">Connection Restored.</span>
        <span className="text-emerald-100 hidden sm:inline">Preparing to synchronize local changes...</span>
      </div>
    );
  }

  return null;
};

export default NetworkBanners;
