/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    dbQuery: (sql: string, params?: any[]) => Promise<any>;
    dbRun: (sql: string, params?: any[]) => Promise<any>;
    dbGet: (sql: string, params?: any[]) => Promise<any>;
    repoCall: (repoName: string, methodName: string, ...args: any[]) => Promise<{success: boolean, data?: any, error?: string}>;
    exportData: () => Promise<any>;
    importData: () => Promise<any>;
    networkStatusChange: (status: 'online' | 'offline') => Promise<any>;
    onAppEvent: (callback: (eventName: string, ...args: any[]) => void) => () => void;
  };
}
