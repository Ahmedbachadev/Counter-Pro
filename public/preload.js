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
  onAppEvent: (callback) => {
    const handler = (event, eventName, ...args) => callback(eventName, ...args);
    ipcRenderer.on('app-event', handler);
    return () => ipcRenderer.removeListener('app-event', handler);
  },

  // Data export/import
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data')
});
