// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  // Generic DB helpers
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  dbGet: (sql, params) => ipcRenderer.invoke('db-get', sql, params),
  repoCall: (repoName, methodName, ...args) => ipcRenderer.invoke('repo-call', repoName, methodName, ...args),
  waitUntilDbReady: () => ipcRenderer.invoke('wait-until-db-ready'),
  
  // Network and Sync
  networkStatusChange: (status) => ipcRenderer.invoke('network-status-change', status),
  
  // Offline-first sync IPC channels
  setSupabaseSession: (accessToken, refreshToken) => ipcRenderer.invoke('set-supabase-session', accessToken, refreshToken),
  initializeSync: (workspaceId) => ipcRenderer.invoke('initialize-sync', workspaceId),
  triggerManualSync: () => ipcRenderer.invoke('trigger-manual-sync'),
  stopSync: () => ipcRenderer.invoke('stop-sync'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),

  onAppEvent: (...args) => {
    let targetEvent = null;
    let callback = null;

    if (args.length === 2) {
      targetEvent = args[0];
      callback = args[1];
    } else if (args.length === 1) {
      callback = args[0];
    }

    // Permanently fix architecture: validate at registration time
    if (typeof callback !== 'function') {
      const registrationStack = new Error().stack;
      console.error('IPC Event Registration Error: callback is not a function', {
        'Event name': targetEvent || 'ALL_EVENTS',
        'Listener index': ipcRenderer.listenerCount('app-event'),
        'Listener value': callback,
        'typeof listener': typeof callback,
        'Registration location': registrationStack,
        'Number of registered listeners': ipcRenderer.listenerCount('app-event')
      });
      // Return a no-op so unmount cleanup doesn't crash
      return () => {};
    }

    const handler = (event, eventName, ...payloadArgs) => {
      if (targetEvent && eventName !== targetEvent) return;

      if (targetEvent) {
        callback(...payloadArgs);
      } else {
        callback(eventName, ...payloadArgs);
      }
    };

    ipcRenderer.on('app-event', handler);
    return () => ipcRenderer.removeListener('app-event', handler);
  },

  // Data export/import
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data')
});
