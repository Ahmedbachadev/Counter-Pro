import React, { useState } from 'react';
import { Search, Filter, MoreVertical, RefreshCw, Trash2, Eye, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { mockQueue } from './mockData';
import { SyncQueueItem } from './syncTypes';

const SyncQueue: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const filteredQueue = mockQueue.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (search && !item.table_name.toLowerCase().includes(search.toLowerCase()) && !item.operation.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: SyncQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pending</span>;
      case 'failed':
        return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed</span>;
      case 'syncing':
        return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Syncing</span>;
      default:
        return null;
    }
  };

  const getOperationBadge = (operation: SyncQueueItem['operation']) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      UPDATE: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      DELETE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${colors[operation] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{operation}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operation Queue</h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search module or operation..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          
          <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>All</button>
            <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'pending' ? 'bg-white dark:bg-gray-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Pending</button>
            <button onClick={() => setFilter('failed')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'failed' ? 'bg-white dark:bg-gray-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Failed</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Reason / Error</th>
                <th className="py-3 px-4 text-center">Retries</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50 text-emerald-500" />
                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">The queue is empty</p>
                    <p className="text-xs mt-1">All changes have been successfully synchronized.</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-200">
                      {item.table_name}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5 font-mono">{item.record_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getOperationBadge(item.operation)}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      {item.error_message ? (
                        <div className="flex items-start gap-1.5 text-red-600 dark:text-red-400 text-xs">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2" title={item.error_message}>{item.error_message}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Waiting in queue...</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium ${item.retry_count > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {item.retry_count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.status === 'failed' && (
                          <button title="Retry" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button title="Inspect Payload" className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-gray-800 dark:hover:text-slate-300 rounded-lg transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button title="Delete" className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SyncQueue;
