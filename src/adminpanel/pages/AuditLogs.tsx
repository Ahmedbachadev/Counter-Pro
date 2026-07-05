import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Download, Calendar, Activity,
  AlertCircle, CheckCircle, Info, XCircle, Shield,
  Database, User, Building2, Key, Globe, Monitor,
  ChevronRight, X, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertTriangle, Settings, FileText, Bell, Users, Eye
} from 'lucide-react';
import supabase from '../../backend/supabaseClient';

// --- Types ---
interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  workspace_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  module: string | null;
  severity: 'Info' | 'Success' | 'Warning' | 'Critical' | null;
  status: 'Success' | 'Failed' | null;
  ip_address: string | null;
  user_agent: string | null;
  before_values: any | null;
  after_values: any | null;
  request_id: string | null;

  // Joined fields
  user?: { name: string; email: string };
  workspace?: { name: string; slug: string };
}

type SortField = 'created_at' | 'action' | 'module' | 'severity';
type SortOrder = 'asc' | 'desc';

// --- Utility Functions ---
const getSeverityColor = (severity: string | null) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-500/30';
    case 'warning': return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30';
    case 'success': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30';
    case 'info':
    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
  }
};

const getSeverityIcon = (severity: string | null) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    case 'success': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'info':
    default: return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  }
};

const getModuleIcon = (moduleName: string | null) => {
  switch (moduleName?.toLowerCase()) {
    case 'authentication': return <Key className="w-4 h-4" />;
    case 'workspace': return <Building2 className="w-4 h-4" />;
    case 'users': return <Users className="w-4 h-4" />;
    case 'platform settings': return <Settings className="w-4 h-4" />;
    case 'notifications': return <Bell className="w-4 h-4" />;
    case 'announcements': return <FileText className="w-4 h-4" />;
    case 'security': return <Shield className="w-4 h-4" />;
    case 'database': return <Database className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const MODULES = ['Authentication', 'Workspace', 'Users', 'Platform Settings', 'Notifications', 'Announcements', 'Security', 'System', 'Database'];
const SEVERITIES = ['Info', 'Success', 'Warning', 'Critical'];
const STATUSES = ['Success', 'Failed'];

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Data
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase!
        .from('activity_logs')
        .select('*, user:users!activity_logs_user_id_fkey(name, email), workspace:workspaces!activity_logs_workspace_id_fkey(name, slug)', { count: 'exact' });

      // Apply Filters
      if (filterModule) query = query.eq('module', filterModule);
      if (filterSeverity) query = query.eq('severity', filterSeverity);
      if (filterStatus) query = query.eq('status', filterStatus);
      if (dateRange.start) query = query.gte('created_at', dateRange.start + 'T00:00:00Z');
      if (dateRange.end) query = query.lte('created_at', dateRange.end + 'T23:59:59Z');

      // Apply Search (Server-side text search across multiple fields)
      if (debouncedSearch) {
        query = query.or(`action.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,entity_type.ilike.%${debouncedSearch}%,entity_id.ilike.%${debouncedSearch}%`);
      }

      // Pagination & Sorting
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;
      setLogs(data as any || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortOrder, debouncedSearch, filterModule, filterSeverity, filterStatus, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      // Fetch all matching records without pagination
      let query = supabase!
        .from('activity_logs')
        .select('*, user:users!activity_logs_user_id_fkey(name, email), workspace:workspaces!activity_logs_workspace_id_fkey(name, slug)');

      if (filterModule) query = query.eq('module', filterModule);
      if (filterSeverity) query = query.eq('severity', filterSeverity);
      if (filterStatus) query = query.eq('status', filterStatus);
      if (dateRange.start) query = query.gte('created_at', dateRange.start + 'T00:00:00Z');
      if (dateRange.end) query = query.lte('created_at', dateRange.end + 'T23:59:59Z');
      if (debouncedSearch) {
        query = query.or(`action.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,entity_type.ilike.%${debouncedSearch}%,entity_id.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(5000); // Limit max export
      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ['Timestamp', 'Action', 'Module', 'Description', 'Severity', 'Status', 'Administrator', 'Admin Email', 'Workspace', 'IP Address', 'User Agent'];
      const csvRows = [headers.join(',')];

      data.forEach((row: any) => {
        csvRows.push([
          `"${new Date(row.created_at).toISOString()}"`,
          `"${row.action}"`,
          `"${row.module || 'System'}"`,
          `"${row.description || ''}"`,
          `"${row.severity || 'Info'}"`,
          `"${row.status || 'Success'}"`,
          `"${row.user?.name || 'System'}"`,
          `"${row.user?.email || ''}"`,
          `"${row.workspace?.name || 'Platform'}"`,
          `"${row.ip_address || ''}"`,
          `"${row.user_agent || ''}"`
        ].join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-500" />
            Enterprise Audit Logs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Immutable record of all administrative actions and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, description, ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterModule}
              onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">All Modules</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(1); }}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(1); }}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              />
            </div>

            {(filterModule || filterSeverity || filterStatus || dateRange.start || dateRange.end || searchQuery) && (
              <button
                onClick={() => {
                  setFilterModule(''); setFilterSeverity(''); setFilterStatus('');
                  setDateRange({ start: '', end: '' }); setSearchQuery(''); setPage(1);
                }}
                className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                title="Clear Filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Action & Module</th>
                <th className="px-6 py-4 font-medium">Administrator</th>
                <th className="px-6 py-4 font-medium">Workspace Target</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading audit logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium text-lg">No records found</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group" onClick={() => setSelectedLog(log)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                          {getModuleIcon(log.module)}
                        </div>
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{log.action}</div>
                          <div className="text-xs text-gray-500">{log.module || 'System'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium">{log.user.name}</div>
                          <div className="text-xs text-gray-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">System</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.workspace ? (
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium truncate max-w-[150px]">{log.workspace.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{log.workspace.slug}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">Platform Level</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                        {getSeverityIcon(log.severity)}
                        {log.severity || 'Info'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {log.status === 'Failed' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className={log.status === 'Failed' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                          {log.status || 'Success'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 text-gray-400 hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = page;
                  if (page < 3) pageNum = i + 1;
                  else if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;

                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === pageNum ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Side Drawer/Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Audit Record Details
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Action</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedLog.action}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</div>
                    <div className="text-gray-700 dark:text-gray-300">{selectedLog.description}</div>
                  </div>
                </div>
                <div className="flex-none space-y-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getSeverityColor(selectedLog.severity)}`}>
                    {getSeverityIcon(selectedLog.severity)}
                    Severity: {selectedLog.severity || 'Info'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedLog.status === 'Failed' ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                    <span className={selectedLog.status === 'Failed' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      Status: {selectedLog.status || 'Success'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meta Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Context</h4>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedLog.created_at).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Timestamp</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.user?.name || 'System Account'}</div>
                      <div className="text-xs text-gray-500">Administrator ({selectedLog.user?.email || 'Auto'})</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.workspace?.name || 'Platform Wide'}</div>
                      <div className="text-xs text-gray-500">Target Workspace</div>
                    </div>
                  </div>
                </div>

                {/* Technical Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Technical Data</h4>

                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.ip_address || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">IP Address</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="w-full">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={selectedLog.user_agent || ''}>
                        {selectedLog.user_agent || 'Unknown Device/Browser'}
                      </div>
                      <div className="text-xs text-gray-500">User Agent</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.entity_type} / {selectedLog.entity_id}</div>
                      <div className="text-xs text-gray-500">Target Entity</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Changes */}
              {(selectedLog.before_values || selectedLog.after_values) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Payload Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.before_values && (
                      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl overflow-hidden">
                        <div className="bg-red-100/50 dark:bg-red-900/30 px-4 py-2 border-b border-red-100 dark:border-red-900/30 text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">
                          Before Values
                        </div>
                        <pre className="p-4 text-xs text-red-900 dark:text-red-300 overflow-x-auto">
                          {JSON.stringify(selectedLog.before_values, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedLog.after_values && (
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl overflow-hidden">
                        <div className="bg-green-100/50 dark:bg-green-900/30 px-4 py-2 border-b border-green-100 dark:border-green-900/30 text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider">
                          After Values
                        </div>
                        <pre className="p-4 text-xs text-green-900 dark:text-green-300 overflow-x-auto">
                          {JSON.stringify(selectedLog.after_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;