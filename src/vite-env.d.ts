/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    dbQuery: (sql: string, params?: any[]) => Promise<any>;
    dbRun: (sql: string, params?: any[]) => Promise<any>;
    dbGet: (sql: string, params?: any[]) => Promise<any>;
    repoCall: (repoName: string, methodName: string, ...args: any[]) => Promise<{success: boolean, data?: any, error?: string}>;
    waitUntilDbReady: () => Promise<boolean>;
    exportData: () => Promise<any>;
    importData: () => Promise<any>;
    networkStatusChange: (status: 'online' | 'offline') => Promise<any>;
    onAppEvent: {
      (eventName: string, callback: (...args: any[]) => void): () => void;
      (callback: (eventName: string, ...args: any[]) => void): () => void;
    };
    
    // Offline-first sync APIs
    setSupabaseSession: (accessToken: string, refreshToken: string) => Promise<{ success: boolean; error?: string }>;
    initializeSync: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
    triggerManualSync: () => Promise<{ success: boolean; error?: string }>;
    stopSync: () => Promise<{ success: boolean; error?: string }>;
    getSyncStatus: () => Promise<{ success: boolean; data?: any; error?: string }>;
  };
}
