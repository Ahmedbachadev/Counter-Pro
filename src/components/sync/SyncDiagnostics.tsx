import React, { useState } from 'react';
import { Activity, Database, CheckCircle2, Search, Table as TableIcon, Key, FileText, AlertCircle, RefreshCw } from 'lucide-react';

const mockDiagnostics = [
  { name: 'Database Integrity', status: 'pass', value: 'OK' },
  { name: 'Queue Integrity', status: 'pass', value: 'OK' },
  { name: 'Repository Health', status: 'pass', value: '14/14 Modules loaded' },
  { name: 'Cloud Connectivity', status: 'pass', value: '24ms latency' },
  { name: 'Authentication', status: 'pass', value: 'Token valid (expires in 4h)' },
  { name: 'Migration Version', status: 'pass', value: 'v2.1.4 (Up to date)' },
  { name: 'SQLite Version', status: 'pass', value: '3.41.2' },
  { name: 'Foreign Keys', status: 'pass', value: 'Enabled & Verified' }
];

const mockTables = [
  { name: 'products', rows: 450, indexes: 3, size: '2.1 MB', lastUpdated: '2 mins ago' },
  { name: 'customers', rows: 120, indexes: 2, size: '450 KB', lastUpdated: '1 hour ago' },
  { name: 'sales', rows: 3450, indexes: 5, size: '8.4 MB', lastUpdated: '5 mins ago' },
  { name: 'sync_queue', rows: 12, indexes: 4, size: '120 KB', lastUpdated: 'Just now' },
];

const SyncDiagnostics: React.FC = () => {
  const [searchTable, setSearchTable] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> System Diagnostics
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Verify the health and integrity of your local database and sync engine.
          </p>
        </div>
        <button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="btn-primary px-4 py-2 flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Checks...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockDiagnostics.map((diag, index) => (
          <div key={index} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex items-start gap-3">
            <div className="mt-0.5">
              {diag.status === 'pass' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{diag.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{diag.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" /> Database Inspector
          </h3>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tables..." 
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-1/4">Table Name</th>
                  <th className="py-3 px-4">Rows</th>
                  <th className="py-3 px-4">Indexes</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
                {mockTables
                  .filter(t => t.name.toLowerCase().includes(searchTable.toLowerCase()))
                  .map((table, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                      <TableIcon className="h-4 w-4 text-slate-400" /> {table.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{table.rows.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Key className="h-3.5 w-3.5" /> {table.indexes}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{table.size}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{table.lastUpdated}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto">
                        <FileText className="h-3.5 w-3.5" /> View Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncDiagnostics;
