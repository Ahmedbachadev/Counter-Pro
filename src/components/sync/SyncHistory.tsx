import React, { useState } from 'react';
import { Download, Search, Filter, Terminal, Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, Info, FileJson, FileText } from 'lucide-react';
import { mockLogs } from './mockData';
import { SyncLog } from './syncTypes';

const SyncHistory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');
  
  const filteredLogs = mockLogs.filter(log => {
    if (filter !== 'all' && log.result !== filter) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.module.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getResultIcon = (result: SyncLog['result']) => {
    switch (result) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Info className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Timeline Overview */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Live Activity Timeline</h4>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-6 bg-slate-50 dark:bg-gray-800/50 rounded-xl overflow-x-auto min-w-full hide-scrollbar">
          <div className="flex flex-col items-center min-w-max">
            <span className="text-xs font-mono text-slate-400 mb-2">09:10:00</span>
            <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex flex-col items-center">
              Sale Created
            </div>
          </div>
          
          <ArrowRight className="h-5 w-5 text-slate-300 dark:text-gray-600 hidden md:block" />
          
          <div className="flex flex-col items-center min-w-max">
            <span className="text-xs font-mono text-slate-400 mb-2">09:10:05</span>
            <div className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex flex-col items-center">
              Queued
            </div>
          </div>
          
          <ArrowRight className="h-5 w-5 text-slate-300 dark:text-gray-600 hidden md:block" />
          
          <div className="flex flex-col items-center min-w-max">
            <span className="text-xs font-mono text-slate-400 mb-2">09:11:12</span>
            <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex flex-col items-center">
              Uploaded
            </div>
          </div>
          
          <ArrowRight className="h-5 w-5 text-slate-300 dark:text-gray-600 hidden md:block" />
          
          <div className="flex flex-col items-center min-w-max">
            <span className="text-xs font-mono text-slate-400 mb-2">09:11:14</span>
            <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex flex-col items-center">
              Cloud Updated
            </div>
          </div>
          
          <ArrowRight className="h-5 w-5 text-slate-300 dark:text-gray-600 hidden md:block" />
          
          <div className="flex flex-col items-center min-w-max">
            <span className="text-xs font-mono text-slate-400 mb-2">09:11:15</span>
            <div className="bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-semibold flex flex-col items-center">
              Completed
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="h-5 w-5" /> Sync Logs
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg py-2 px-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Results</option>
            <option value="success">Success Only</option>
            <option value="error">Errors Only</option>
            <option value="warning">Warnings Only</option>
          </select>
          
          <div className="flex gap-2">
            <button title="Export JSON" className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <FileJson className="h-4 w-4" />
            </button>
            <button title="Export CSV" className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="text-[10px] ml-1">{new Date(log.timestamp).getMilliseconds()}ms</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {getResultIcon(log.result)}
                        <span className={`font-semibold ${
                          log.result === 'error' ? 'text-red-700 dark:text-red-400' :
                          log.result === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                          'text-slate-900 dark:text-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      {log.error_details && (
                        <span className="text-xs text-slate-500 mt-1 ml-6">{log.error_details}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                    {log.duration_ms}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SyncHistory;
