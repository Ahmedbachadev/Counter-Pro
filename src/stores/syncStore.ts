import { create } from 'zustand';

export type SyncStage = 'idle' | 'uploading' | 'downloading' | 'resolving' | 'finished' | 'error';

export interface SyncProgress {
  stage: SyncStage;
  currentModule: string;
  completedOperations: number;
  totalOperations: number;
  uploadCount: number;
  downloadCount: number;
  failedCount: number;
  retryCount: number;
  percentage: number;
  message?: string;
}

export interface SyncToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  progress: SyncProgress | null;
  lastSyncedAt: string | null;
  pendingCount: number;
  queueStats: { pending: number; syncing: number; failed: number };
  toasts: SyncToast[];
  
  // Actions
  setOnlineStatus: (status: boolean) => void;
  setSyncProgress: (progress: SyncProgress) => void;
  setSyncComplete: () => void;
  setSyncError: () => void;
  updateQueueStats: (stats: { pending: number; syncing: number; failed: number }) => void;
  addToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  
  // Triggers
  requestManualSync: () => void;
  initializeListeners: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  progress: null,
  lastSyncedAt: null,
  pendingCount: 0,
  queueStats: { pending: 0, syncing: 0, failed: 0 },
  toasts: [],

  setOnlineStatus: (status: boolean) => {
    const wasOffline = !get().isOnline;
    set({ isOnline: status });
    if (wasOffline && status) {
      get().addToast('Connection Restored', 'success');
    } else if (!wasOffline && !status) {
      get().addToast('Working Offline', 'warning');
    }
  },

  setSyncProgress: (progress: SyncProgress) => {
    set({ isSyncing: true, progress });
  },

  setSyncComplete: () => {
    const { progress } = get();
    if (progress && (progress.uploadCount > 0 || progress.downloadCount > 0)) {
      get().addToast(`Synchronization completed (${progress.uploadCount} uploaded, ${progress.downloadCount} downloaded)`, 'success');
    }
    set({ isSyncing: false, progress: null, lastSyncedAt: new Date().toISOString() });
  },

  setSyncError: () => {
    set({ isSyncing: false });
    get().addToast('Synchronization failed', 'error');
  },

  updateQueueStats: (stats) => {
    set({ queueStats: stats, pendingCount: stats.pending });
  },

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, timestamp: Date.now() }]
    }));
    // Auto remove after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  requestManualSync: () => {
    get().addToast('Manual synchronization requested...', 'info');
    // TODO: Send IPC command to trigger sync manually when implemented in backend
  },

  initializeListeners: () => {
    if (window.electronAPI && window.electronAPI.onAppEvent) {
      // Listen to backend SyncEngine events
      window.electronAPI.onAppEvent('sync:start', (data: any) => {
        get().setSyncProgress(data);
      });
      window.electronAPI.onAppEvent('sync:progress', (data: any) => {
        get().setSyncProgress(data);
      });
      window.electronAPI.onAppEvent('sync:upload', (data: any) => {
        get().setSyncProgress(data);
      });
      window.electronAPI.onAppEvent('sync:download', (data: any) => {
        get().setSyncProgress(data);
      });
      window.electronAPI.onAppEvent('sync:complete', () => {
        get().setSyncComplete();
      });
      window.electronAPI.onAppEvent('sync:error', () => {
        get().setSyncError();
      });
      window.electronAPI.onAppEvent('queue:added', () => {
        // Optimistically increment pending count
        set(state => ({ pendingCount: state.pendingCount + 1, queueStats: { ...state.queueStats, pending: state.queueStats.pending + 1 } }));
      });
      window.electronAPI.onAppEvent('queue:removed', (ids: string[]) => {
        set(state => ({ 
          pendingCount: Math.max(0, state.pendingCount - (ids?.length || 1)),
          queueStats: { ...state.queueStats, pending: Math.max(0, state.queueStats.pending - (ids?.length || 1)) }
        }));
      });
    }

    // Monitor Network
    window.addEventListener('online', () => get().setOnlineStatus(true));
    window.addEventListener('offline', () => get().setOnlineStatus(false));
  }
}));
