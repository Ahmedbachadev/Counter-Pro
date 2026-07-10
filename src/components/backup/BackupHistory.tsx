import React, { useState } from 'react';
import { Search, Filter, History, Download, Upload, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';
import { useBackupStore } from '../../stores/backupStore';
import { BackupRecord } from './backupTypes';

const BackupHistory: React.FC = () => {
  const { backups, openRestoreWizard } = useBackupStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'Full' | 'Incremental' | 'Manual'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredBackups = backups.filter(backup => {
    if (filter !== 'all' && backup.type !== filter) return false;
    if (search && !backup.id.toLowerCase().includes(search.toLowerCase()) && !backup.createdBy.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatusIcon = (status: BackupRecord['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <RefreshCcw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" /> Backup History
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            View past backups, check details, or initiate a restore.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search backups..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg py-2 px-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Full">Full Backups</option>
            <option value="Incremental">Incremental</option>
            <option value="Manual">Manual</option>
          </select>
          
          <div className="flex gap-2">
            <button title="Export Backup" className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <Download className="h-4 w-4" />
            </button>
            <button title="Import Backup" className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
              {filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">No backups found</p>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((backup) => (
                  <React.Fragment key={backup.id}>
                    <tr className={`hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${expandedId === backup.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`} onClick={() => toggleExpand(backup.id)}>
                      <td className="py-3 px-4 text-slate-400">
                        {expandedId === backup.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium">{new Date(backup.createdAt).toLocaleDateString()}</span>
                          <span className="text-slate-500 text-xs ml-1">{new Date(backup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          backup.type === 'Full' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          backup.type === 'Incremental' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-300'
                        }`}>
                          {backup.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatSize(backup.compressedSizeBytes || backup.sizeBytes)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs capitalize">
                          {getStatusIcon(backup.status)}
                          {backup.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {backup.verificationPassed ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5"/> Passed</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5"/> Failed</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openRestoreWizard(backup.id); }}
                          disabled={backup.status === 'failed'}
                          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                    {expandedId === backup.id && (
                      <tr className="bg-slate-50/50 dark:bg-gray-800/30 border-b border-slate-200 dark:border-gray-800">
                        <td colSpan={7} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Backup Details</p>
                              <div className="space-y-2">
                                <div className="flex justify-between"><span className="text-slate-500">ID:</span> <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{backup.id}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Created By:</span> <span className="text-slate-700 dark:text-slate-300">{backup.createdBy}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Duration:</span> <span className="text-slate-700 dark:text-slate-300">{(backup.durationMs / 1000).toFixed(1)}s</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Version:</span> <span className="text-slate-700 dark:text-slate-300">{backup.version}</span></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Data Metrics</p>
                              <div className="space-y-2">
                                <div className="flex justify-between"><span className="text-slate-500">Raw Size:</span> <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{formatSize(backup.sizeBytes)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Compressed:</span> <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{formatSize(backup.compressedSizeBytes)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Records:</span> <span className="text-slate-700 dark:text-slate-300">{backup.totalRecords.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Tables:</span> <span className="text-slate-700 dark:text-slate-300">{backup.tablesIncluded.length} included</span></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Storage & Security</p>
                              <div className="space-y-2">
                                <div className="flex flex-col"><span className="text-slate-500 mb-1">Location:</span> <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-gray-900 p-1.5 rounded border border-slate-200 dark:border-gray-800">{backup.location}</span></div>
                                <div className="flex flex-col mt-2"><span className="text-slate-500 mb-1">Checksum (MD5):</span> <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-gray-900 p-1.5 rounded border border-slate-200 dark:border-gray-800">{backup.checksum}</span></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupHistory;
