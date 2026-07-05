// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Generic DB helpers
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  dbGet: (sql, params) => ipcRenderer.invoke('db-get', sql, params),

  // Convenience helpers for inventory
  getProducts: async () => {
    const res = await ipcRenderer.invoke('get-products');
    return res;
  },
  softDeleteProduct: async (id) => {
    const res = await ipcRenderer.invoke('soft-delete-product', id);
    return res;
  },

  // Data export/import
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),

  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => ipcRenderer.invoke('platform'),

  // Navigation & events
  onNavigate: (callback) => ipcRenderer.on('navigate-to', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
