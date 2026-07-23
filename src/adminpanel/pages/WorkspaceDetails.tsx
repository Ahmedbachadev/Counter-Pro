import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Phone, MapPin, Calendar, Mail,
  Package, Users, ShoppingCart, DollarSign, Activity,
  Shield, HardDrive, Settings, History, CheckCircle, XCircle,
  AlertTriangle, Power, PowerOff, Trash2, RefreshCw, Timer,
  RotateCcw, Infinity, Edit, Loader2, X, TrendingUp, CreditCard,
  FileText, Clock, ChevronRight, Eye, BadgeCheck, Layers
} from 'lucide-react';
import supabase from '../../backend/supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  status: string;
  access_period: string;
  activation_date: string;
  expiry_date: string;
  is_lifetime: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  business_category?: string;
  internal_notes?: string;
  // Owner info from join
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
}

interface WorkspaceUser {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  last_active?: string;
  created_at: string;
}

interface WorkspaceStats {
  employeeCount: number;
  productCount: number;
  customerCount: number;
  supplierCount: number;
  saleCount: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
  monthSales: number;
  monthRevenue: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type?: string;
  description?: string;
  created_at: string;
}

interface LicenseHistoryEntry {
  id: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const fmtDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('en-GB') : '—';
const fmtCurrency = (n: number) => `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

const StatusBadge: React.FC<{ status: string; large?: boolean }> = ({ status, large }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    active:    { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',     icon: <CheckCircle className={large ? 'w-4 h-4' : 'w-3 h-3'} /> },
    expired:   { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',             icon: <XCircle className={large ? 'w-4 h-4' : 'w-3 h-3'} /> },
    suspended: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',     icon: <AlertTriangle className={large ? 'w-4 h-4' : 'w-3 h-3'} /> },
    disabled:  { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',            icon: <PowerOff className={large ? 'w-4 h-4' : 'w-3 h-3'} /> },
    deleted:   { cls: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',             icon: <Trash2 className={large ? 'w-4 h-4' : 'w-3 h-3'} /> },
  };
  const cfg = map[status?.toLowerCase()] ?? { cls: 'bg-gray-100 text-gray-500', icon: <Clock className={large ? 'w-4 h-4' : 'w-3 h-3'} /> };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${large ? 'text-sm' : 'text-xs'} ${cfg.cls}`}>
      {cfg.icon} {status || 'Unknown'}
    </span>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; color: string; label: string; value: string | number; sub?: string }> = ({ icon, color, label, value, sub }) => (
  <div className="bg-white dark:bg-[#161b22] rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const InfoRow: React.FC<{ icon?: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
    {icon && <div className="w-5 h-5 text-gray-400 mt-0.5 shrink-0">{icon}</div>}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-sm font-medium text-gray-900 dark:text-white break-words">{value}</div>
    </div>
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

const ConfirmDialog: React.FC<{
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => Promise<void>; onClose: () => void;
}> = ({ title, message, confirmLabel, danger, onConfirm, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleConfirm = async () => {
    setLoading(true); setError('');
    try { await onConfirm(); }
    catch (e: any) { setError(e.message || 'Operation failed'); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">{message}</p>
          {error && <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Working...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Extend Access Modal ──────────────────────────────────────────────────────

const ExtendAccessModal: React.FC<{ workspace: WorkspaceDetail; onClose: () => void; onSaved: () => void }> = ({ workspace, onClose, onSaved }) => {
  const [period, setPeriod] = useState('1 Month');
  const [isLifetime, setIsLifetime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const calcExpiry = (): string | null => {
    if (isLifetime) return null;
    const base = new Date();
    if (period === '1 Month') base.setMonth(base.getMonth() + 1);
    else if (period === '6 Months') base.setMonth(base.getMonth() + 6);
    else if (period === '12 Months') base.setFullYear(base.getFullYear() + 1);
    return base.toISOString();
  };

  const handleExtend = async () => {
    setSaving(true); setError('');
    try {
      const { error: err } = await supabase!.rpc('admin_extend_workspace_access', {
        p_workspace_id: workspace.id,
        p_access_period: isLifetime ? 'Lifetime' : period,
        p_is_lifetime: isLifetime,
        p_new_expiry_date: calcExpiry(),
      });
      if (err) throw err;
      onSaved();
    } catch (e: any) { setError(e.message || 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Extend / Change Access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ext_lifetime" checked={isLifetime} onChange={e => setIsLifetime(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
            <label htmlFor="ext_lifetime" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Infinity className="w-4 h-4 text-indigo-500" /> Convert to Lifetime</label>
          </div>
          {!isLifetime && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Period</p>
              <div className="grid grid-cols-3 gap-2">
                {['1 Month', '6 Months', '12 Months'].map(opt => (
                  <button key={opt} onClick={() => setPeriod(opt)}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${period === opt ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isLifetime && <p className="text-sm text-gray-500">New expiry: <strong className="text-gray-900 dark:text-white">{fmtDate(calcExpiry())}</strong></p>}
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">Cancel</button>
          <button onClick={handleExtend} disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Timer className="w-4 h-4" /> Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',   icon: Building2 },
  { id: 'users',     label: 'Users',      icon: Users },
  { id: 'activity',  label: 'Activity',   icon: Activity },
  { id: 'license',   label: 'License',    icon: Shield },
  { id: 'settings',  label: 'Settings',   icon: Settings },
  { id: 'audit',     label: 'Audit Logs', icon: History },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const WorkspaceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [stats, setStats] = useState<WorkspaceStats>({
    employeeCount: 0, productCount: 0, customerCount: 0, supplierCount: 0,
    saleCount: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0,
    monthSales: 0, monthRevenue: 0,
  });
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [licenseHistory, setLicenseHistory] = useState<LicenseHistoryEntry[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [wsSettings, setWsSettings] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [taxConfigs, setTaxConfigs] = useState<any[]>([]);

  const [actionModal, setActionModal] = useState<
    { type: 'confirm'; title: string; message: string; action: string; danger?: boolean } |
    { type: 'extend' } |
    null
  >(null);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      // Workspace + users
      const { data: ws, error: wsErr } = await supabase!
        .from('workspaces')
        .select('*, users!users_workspace_id_fkey(id, name, username, email, phone, role, status, last_active, created_at)')
        .eq('id', id)
        .maybeSingle();

      if (wsErr) throw wsErr;
      if (!ws) { setWorkspace(null); setLoading(false); return; }

      const ownerUser = ws.users?.find((u: any) => u.role === 'Admin' || u.role === 'Owner') || ws.users?.[0];
      setWorkspace({
        ...ws,
        owner_name: ownerUser?.name || ownerUser?.username || 'Unknown',
        owner_email: ownerUser?.email || ws.business_email || '—',
        owner_phone: ownerUser?.phone || ws.business_phone || '—',
      });
      setUsers(ws.users || []);

      // Parallel fetches
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        productRes, customerRes, supplierRes,
        salesRes, todaySalesRes, monthSalesRes,
        activityRes, licenseRes,
        profileRes, settingsRes, pmRes, taxRes,
      ] = await Promise.allSettled([
        supabase!.from('products').select('id', { count: 'exact', head: true }).eq('workspace_id', id).is('deleted_at', null),
        supabase!.from('customers').select('id', { count: 'exact', head: true }).eq('workspace_id', id).is('deleted_at', null),
        supabase!.from('suppliers').select('id', { count: 'exact', head: true }).eq('workspace_id', id).is('deleted_at', null),
        supabase!.from('sales').select('final_amount').eq('workspace_id', id).is('deleted_at', null),
        supabase!.from('sales').select('final_amount').eq('workspace_id', id).gte('created_at', today.toISOString()).is('deleted_at', null),
        supabase!.from('sales').select('final_amount').eq('workspace_id', id).gte('created_at', monthStart.toISOString()).is('deleted_at', null),
        supabase!.from('activity_logs').select('id, action, entity_type, description, created_at').eq('workspace_id', id).order('created_at', { ascending: false }).limit(50),
        supabase!.from('license_history').select('id, action, previous_value, new_value, created_at').eq('workspace_id', id).order('created_at', { ascending: false }).limit(20),
        supabase!.from('business_profiles').select('*').eq('workspace_id', id).maybeSingle(),
        supabase!.from('settings').select('*').eq('workspace_id', id).maybeSingle(),
        supabase!.from('payment_methods').select('*').eq('workspace_id', id).is('deleted_at', null),
        supabase!.from('tax_configurations').select('*').eq('workspace_id', id).is('deleted_at', null),
      ]);

      const getVal = <T,>(res: PromiseSettledResult<any>): T | null =>
        res.status === 'fulfilled' ? res.value.data : null;
      const getCount = (res: PromiseSettledResult<any>): number =>
        res.status === 'fulfilled' ? (res.value.count ?? 0) : 0;

      const salesData = getVal<any[]>(salesRes) ?? [];
      const todaySalesData = getVal<any[]>(todaySalesRes) ?? [];
      const monthSalesData = getVal<any[]>(monthSalesRes) ?? [];

      setStats({
        employeeCount: ws.users?.length || 0,
        productCount: getCount(productRes),
        customerCount: getCount(customerRes),
        supplierCount: getCount(supplierRes),
        saleCount: salesData.length,
        totalRevenue: salesData.reduce((sum, s) => sum + (Number(s.final_amount) || 0), 0),
        todaySales: todaySalesData.length,
        todayRevenue: todaySalesData.reduce((sum, s) => sum + (Number(s.final_amount) || 0), 0),
        monthSales: monthSalesData.length,
        monthRevenue: monthSalesData.reduce((sum, s) => sum + (Number(s.final_amount) || 0), 0),
      });

      setActivityLogs(getVal<AuditLog[]>(activityRes) ?? []);
      setLicenseHistory(getVal<LicenseHistoryEntry[]>(licenseRes) ?? []);
      setBusinessProfile(getVal<any>(profileRes));
      setWsSettings(getVal<any>(settingsRes));
      setPaymentMethods(getVal<any[]>(pmRes) ?? []);
      setTaxConfigs(getVal<any[]>(taxRes) ?? []);

    } catch (e: any) {
      console.error('WorkspaceDetails error:', e);
      setError(e.message || 'Failed to load workspace details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const performAction = async (action: string) => {
    switch (action) {
      case 'Activate':
        await supabase!.rpc('admin_update_workspace_status', { p_workspace_id: id, p_status: 'Active' }); break;
      case 'Suspend':
        await supabase!.rpc('admin_update_workspace_status', { p_workspace_id: id, p_status: 'Suspended' }); break;
      case 'Disable':
        await supabase!.rpc('admin_update_workspace_status', { p_workspace_id: id, p_status: 'Disabled' }); break;
      case 'Delete':
        await supabase!.rpc('admin_soft_delete_workspace', { p_workspace_id: id });
        navigate('/adminpanel/workspaces');
        return;
      case 'Restore':
        await supabase!.rpc('admin_restore_workspace', { p_workspace_id: id }); break;
      default: break;
    }
    fetchAll();
    setActionModal(null);
  };

  const openConfirm = (action: string, title: string, message: string, danger?: boolean) => {
    setActionModal({ type: 'confirm', action, title, message, danger });
  };

  const daysRemaining = workspace
    ? workspace.is_lifetime ? null
      : Math.max(0, Math.ceil((new Date(workspace.expiry_date).getTime() - Date.now()) / 86400000))
    : null;

  const accessProgress = workspace && !workspace.is_lifetime && workspace.activation_date && workspace.expiry_date
    ? Math.min(100, Math.max(0, (
        (Date.now() - new Date(workspace.activation_date).getTime()) /
        (new Date(workspace.expiry_date).getTime() - new Date(workspace.activation_date).getTime())
      ) * 100))
    : 0;

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="w-20 h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-64 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800" />)}
        </div>
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to Load</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button onClick={fetchAll} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workspace Not Found</h3>
        <button onClick={() => navigate('/adminpanel/workspaces')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <button onClick={() => navigate('/adminpanel/workspaces')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors self-start">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
            {workspace.logo_url
              ? <img src={workspace.logo_url} alt="" className="w-full h-full object-cover" />
              : workspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{workspace.name}</h1>
              <StatusBadge status={workspace.status} large />
              {workspace.is_lifetime && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Infinity className="w-3 h-3" /> Lifetime
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1 truncate">{workspace.id}</p>
            {workspace.business_category && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Layers className="w-3 h-3" /> {workspace.business_category}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button onClick={fetchAll} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setActionModal({ type: 'extend' })}
            className="px-3 py-2 text-sm font-medium bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Timer className="w-4 h-4" /> Extend Access
          </button>

          {/* Status actions dropdown */}
          <div className="relative group">
            <button className="px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-1.5">
              Actions <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1">
              {workspace.status !== 'Active' && (
                <button onClick={() => openConfirm('Activate', 'Activate Workspace', `Re-activate "${workspace.name}"?`)}
                  className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors">
                  <Power className="w-4 h-4" /> Activate
                </button>
              )}
              {workspace.status === 'Active' && (
                <button onClick={() => openConfirm('Suspend', 'Suspend Workspace', `Suspend "${workspace.name}"? Users will lose access.`, true)}
                  className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2.5 transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Suspend
                </button>
              )}
              <button onClick={() => openConfirm('Disable', 'Disable Workspace', `Disable "${workspace.name}"? This is a permanent restriction.`, true)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors">
                <PowerOff className="w-4 h-4" /> Disable
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              {workspace.deleted_at ? (
                <button onClick={() => openConfirm('Restore', 'Restore Workspace', `Restore "${workspace.name}" to Active?`)}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors">
                  <RotateCcw className="w-4 h-4" /> Restore
                </button>
              ) : (
                <button onClick={() => openConfirm('Delete', 'Delete Workspace', `Soft-delete "${workspace.name}"? It can be restored later.`, true)}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} color="bg-indigo-50 dark:bg-indigo-900/30" label="Employees" value={stats.employeeCount} />
            <StatCard icon={<Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-50 dark:bg-emerald-900/30" label="Products" value={stats.productCount} />
            <StatCard icon={<User className="w-5 h-5 text-blue-600 dark:text-blue-400" />} color="bg-blue-50 dark:bg-blue-900/30" label="Customers" value={stats.customerCount} />
            <StatCard icon={<ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />} color="bg-purple-50 dark:bg-purple-900/30" label="Total Sales" value={stats.saleCount} />
            <StatCard icon={<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />} color="bg-green-50 dark:bg-green-900/30" label="Total Revenue" value={fmtCurrency(stats.totalRevenue)} />
          </div>

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Today</p>
              </div>
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{fmtCurrency(stats.todayRevenue)}</p>
              <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-1">{stats.todaySales} sales today</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Calendar className="w-4 h-4" /> This Month</p>
              </div>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{fmtCurrency(stats.monthRevenue)}</p>
              <p className="text-sm text-emerald-500 dark:text-emerald-400 mt-1">{stats.monthSales} sales this month</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business & Owner Info */}
            <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Owner & Business</h3>
              </div>
              <div className="px-5 py-2">
                <InfoRow icon={<User className="w-4 h-4" />} label="Owner Name" value={workspace.owner_name || '—'} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Owner Email" value={workspace.owner_email || '—'} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Business Phone" value={workspace.business_phone || '—'} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Business Email" value={workspace.business_email || '—'} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={workspace.business_address || '—'} />
                <InfoRow icon={<Layers className="w-4 h-4" />} label="Category" value={workspace.business_category || '—'} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created" value={fmtDate(workspace.created_at)} />
              </div>
            </div>

            {/* Access Period */}
            <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500" /> Access & License</h3>
              </div>
              <div className="px-5 py-2">
                <InfoRow label="Plan" value={workspace.is_lifetime ? (
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold"><Infinity className="w-4 h-4" /> Lifetime</span>
                ) : workspace.access_period} />
                <InfoRow label="Status" value={<StatusBadge status={workspace.status} />} />
                <InfoRow label="Activation Date" value={fmtDate(workspace.activation_date)} />
                <InfoRow label="Expiry Date" value={workspace.is_lifetime ? 'Never' : fmtDate(workspace.expiry_date)} />
                {!workspace.is_lifetime && daysRemaining !== null && (
                  <InfoRow label="Days Remaining" value={
                    <span className={daysRemaining <= 0 ? 'text-red-600 font-bold' : daysRemaining <= 7 ? 'text-amber-600 font-semibold' : 'text-gray-900 dark:text-white'}>
                      {daysRemaining} days
                    </span>
                  } />
                )}
              </div>
              {!workspace.is_lifetime && workspace.activation_date && workspace.expiry_date && (
                <div className="px-5 pb-5">
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${accessProgress >= 90 ? 'bg-red-500' : accessProgress >= 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${accessProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-right">{Math.round(accessProgress)}% elapsed</p>
                </div>
              )}
              {workspace.internal_notes && (
                <div className="px-5 pb-5">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">Internal Notes</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">{workspace.internal_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Workspace Users ({users.length})</h3>
          </div>
          {users.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Users className="w-10 h-10 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/80 dark:bg-[#0d1117]/60">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Last Active', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {(u.name || u.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name || u.username || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{u.email || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'Admin' || u.role === 'Owner' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {u.role === 'Admin' ? <BadgeCheck className="w-3 h-3" /> : null} {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDateTime(u.last_active)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> Activity Logs ({activityLogs.length})</h3>
          </div>
          {activityLogs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Activity className="w-10 h-10 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
              {activityLogs.map(log => (
                <div key={log.id} className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">{log.action}</span>
                        {log.entity_type && <span className="text-xs text-gray-400">{log.entity_type}</span>}
                      </div>
                      {log.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.description}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fmtDateTime(log.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LICENSE TAB */}
      {activeTab === 'license' && (
        <div className="space-y-6">
          {/* Current License */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500" /> Current License</h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Plan', value: workspace.is_lifetime ? '∞ Lifetime' : workspace.access_period },
                { label: 'Status', value: workspace.status },
                { label: 'Activation', value: fmtDate(workspace.activation_date) },
                { label: 'Expiry', value: workspace.is_lifetime ? 'Never' : fmtDate(workspace.expiry_date) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-[#0d1117] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-1">{label}</p>
                  <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            {!workspace.is_lifetime && daysRemaining !== null && (
              <div className="px-5 pb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Access Usage</span>
                  <span className={`text-sm font-bold ${daysRemaining <= 0 ? 'text-red-600' : daysRemaining <= 7 ? 'text-amber-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {daysRemaining} days remaining
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                  <div className={`h-3 rounded-full ${accessProgress >= 90 ? 'bg-red-500' : accessProgress >= 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${accessProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* License History */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> License History</h3>
            </div>
            {licenseHistory.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <History className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No license changes recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {licenseHistory.map(entry => (
                  <div key={entry.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded">{entry.action}</span>
                        {entry.new_value && <span className="text-sm text-gray-700 dark:text-gray-300">→ {entry.new_value}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Profile */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-500" /> Business Profile</h3>
            </div>
            <div className="px-5 py-2">
              {businessProfile ? (
                <>
                  <InfoRow label="Business Name" value={businessProfile.business_name} />
                  <InfoRow label="Email" value={businessProfile.email || '—'} />
                  <InfoRow label="Phone" value={businessProfile.phone || '—'} />
                  <InfoRow label="Address" value={businessProfile.address || '—'} />
                  <InfoRow label="Website" value={businessProfile.website || '—'} />
                  <InfoRow label="Tax ID" value={businessProfile.tax_registration_number || '—'} />
                </>
              ) : (
                <p className="py-6 text-sm text-center text-gray-400">No business profile configured</p>
              )}
            </div>
          </div>

          {/* App Settings */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500" /> App Settings</h3>
            </div>
            <div className="px-5 py-2">
              {wsSettings ? (
                <>
                  <InfoRow label="Currency" value={`${wsSettings.currency} (${wsSettings.currency_symbol})`} />
                  <InfoRow label="Date Format" value={wsSettings.date_format || '—'} />
                  <InfoRow label="Low Stock Threshold" value={wsSettings.low_stock_threshold ?? '—'} />
                  <InfoRow label="Receipt Size" value={wsSettings.receipt_size || '—'} />
                </>
              ) : (
                <p className="py-6 text-sm text-center text-gray-400">No settings configured</p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Payment Methods ({paymentMethods.length})</h3>
            </div>
            <div className="px-5 py-3 space-y-2">
              {paymentMethods.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">No payment methods</p>
              ) : paymentMethods.map(pm => (
                <div key={pm.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pm.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{pm.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{pm.method_type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Configs */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Tax Configurations ({taxConfigs.length})</h3>
            </div>
            <div className="px-5 py-3 space-y-2">
              {taxConfigs.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">No tax configurations</p>
              ) : taxConfigs.map(tc => (
                <div key={tc.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tc.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{tc.name}</span>
                    {tc.is_default && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">Default</span>}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{tc.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> Audit Logs</h3>
            <span className="text-xs text-gray-400">Last 50 entries</span>
          </div>
          {activityLogs.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <History className="w-12 h-12 text-gray-200 dark:text-gray-800" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No audit logs available</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/80 dark:bg-[#0d1117]/60 sticky top-0">
                  <tr>
                    {['Action', 'Entity', 'Description', 'Timestamp'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {activityLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.entity_type || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-sm truncate">{log.description || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {actionModal?.type === 'confirm' && (
        <ConfirmDialog
          title={actionModal.title}
          message={actionModal.message}
          confirmLabel={actionModal.action}
          danger={actionModal.danger}
          onConfirm={() => performAction(actionModal.action)}
          onClose={() => setActionModal(null)}
        />
      )}

      {actionModal?.type === 'extend' && (
        <ExtendAccessModal
          workspace={workspace}
          onClose={() => setActionModal(null)}
          onSaved={() => { setActionModal(null); fetchAll(); }}
        />
      )}
    </div>
  );
};

export default WorkspaceDetails;
