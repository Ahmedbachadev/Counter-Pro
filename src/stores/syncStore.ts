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
  initialSyncFailed: boolean;
  
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

/**
 * Map of table names to the store refresh functions they should trigger.
 * This is used by the sync:data-updated event to refresh only affected stores.
 */
function refreshStoresAfterSync(updatedTables: string[]) {
  const tableToRefresh: Record<string, () => Promise<void>> = {};

  // Lazy-load store references to avoid circular imports
  try {
    const { useInventoryStore } = require('./inventoryStore');
    const { useCustomerStore } = require('./customersStore');
    const { usePOSStore } = require('./posStore');
    const { useSettingsStore } = require('./settingsStore');
    const { useSupplierStore } = require('./supplierStore');
    const { useExpensesStore } = require('./expensesStore');
    const { usePurchaseStore } = require('./purchaseStore');

    tableToRefresh['products'] = () => useInventoryStore.getState().initializeFromDatabase();
    tableToRefresh['categories'] = () => useInventoryStore.getState().initializeFromDatabase();
    tableToRefresh['customers'] = () => useCustomerStore.getState().initializeFromDatabase();
    tableToRefresh['sales'] = () => usePOSStore.getState().initializeFromDatabase();
    tableToRefresh['sale_items'] = () => usePOSStore.getState().initializeFromDatabase();
    tableToRefresh['settings'] = () => useSettingsStore.getState().initializeFromDatabase();
    tableToRefresh['suppliers'] = () => useSupplierStore.getState().initializeFromDatabase();
    tableToRefresh['expenses'] = () => useExpensesStore.getState().initializeFromDatabase();
    tableToRefresh['purchases'] = () => usePurchaseStore.getState().initializeFromDatabase();
    tableToRefresh['purchase_items'] = () => usePurchaseStore.getState().initializeFromDatabase();
  } catch (err) {
    console.error('[SyncStore] Failed to load stores for refresh:', err);
    return;
  }

  // Deduplicate refresh calls (e.g., both products and categories refresh inventory)
  const refreshed = new Set<string>();

  for (const table of updatedTables) {
    const refreshFn = tableToRefresh[table];
    if (refreshFn && !refreshed.has(table)) {
      refreshed.add(table);
      refreshFn().catch(err => {
        console.error(`[SyncStore] Failed to refresh store for table ${table}:`, err);
      });
    }
  }

  if (refreshed.size > 0) {
    console.log(`[SyncStore] Refreshed stores for tables: ${Array.from(refreshed).join(', ')}`);
  }
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  progress: null,
  lastSyncedAt: null,
  pendingCount: 0,
  queueStats: { pending: 0, syncing: 0, failed: 0 },
  toasts: [],
  initialSyncFailed: false,

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
    // Send IPC command to trigger sync in the main process
    if (window.electronAPI?.triggerManualSync) {
      window.electronAPI.triggerManualSync().catch((err: any) => {
        console.error('[SyncStore] Manual sync request failed:', err);
      });
    }
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

      // ── Offline-first: Refresh stores when sync downloads new data ──
      window.electronAPI.onAppEvent('sync:data-updated', (updatedTables: string[]) => {
        console.log('[SyncStore] Data updated from cloud, refreshing stores for:', updatedTables);
        refreshStoresAfterSync(updatedTables);
      });

      // ── Initial sync events ──
      window.electronAPI.onAppEvent('sync:initial-start', () => {
        get().addToast('Downloading workspace data...', 'info');
      });
      window.electronAPI.onAppEvent('sync:initial-complete', (data: any) => {
        if (data?.totalDownloaded > 0) {
          get().addToast(`Initial sync complete — ${data.totalDownloaded} records downloaded`, 'success');
          // Refresh all stores after initial sync
          refreshStoresAfterSync([
            'categories', 'products', 'customers', 'suppliers',
            'expenses', 'purchases', 'purchase_items',
            'sales', 'sale_items', 'inventory_movements',
            'settings', 'users'
          ]);
        }
        set({ initialSyncFailed: false });
      });
      window.electronAPI.onAppEvent('sync:initial-error', (data: any) => {
        get().addToast(`Initial sync failed: ${data?.error || 'Unknown error'}`, 'error');
        set({ initialSyncFailed: true });
      });
    }

    // Monitor Network
    window.addEventListener('online', () => get().setOnlineStatus(true));
    window.addEventListener('offline', () => get().setOnlineStatus(false));
  }
}));
