import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, MoreVertical,
  CheckCircle, XCircle, AlertTriangle, Clock, ArrowUpDown,
  Plus, Edit, Trash2, Power, PowerOff, X, ChevronLeft, ChevronRight,
  Building2, User, ShieldCheck, Calendar, Eye, EyeOff, Loader2,
  RefreshCw, RotateCcw, Infinity, Timer
} from 'lucide-react';
import supabase from '../../backend/supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkspaceRow {
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
  business_email?: string;
  business_phone?: string;
  owner_name?: string;
  owner_email?: string;
  employee_count?: number;
}

type SortField = 'name' | 'status' | 'created_at' | 'expiry_date' | 'access_period';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcDaysRemaining = (expiry: string, isLifetime: boolean): string | number => {
  if (isLifetime) return '∞';
  if (!expiry) return 'N/A';
  const diff = new Date(expiry).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return days > 0 ? days : 0;
};

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    active:    { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',   label: 'Active',    icon: <CheckCircle className="w-3 h-3" /> },
    expired:   { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',           label: 'Expired',   icon: <XCircle className="w-3 h-3" /> },
    suspended: { cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Suspended', icon: <AlertTriangle className="w-3 h-3" /> },
    disabled:  { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',          label: 'Disabled',  icon: <PowerOff className="w-3 h-3" /> },
    deleted:   { cls: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',           label: 'Deleted',   icon: <Trash2 className="w-3 h-3" /> },
  };
  const cfg = map[status?.toLowerCase()] ?? { cls: 'bg-gray-100 text-gray-600', label: status, icon: <Clock className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const WizardStep: React.FC<{ step: number; current: number; label: string; icon: React.ReactNode }> = ({ step, current, label, icon }) => {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
        ${done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
        {done ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium hidden sm:block ${active ? 'text-indigo-600 dark:text-indigo-400' : done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
};

// ─── Input helper ─────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}> = ({ label, required, children, hint, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors shadow-sm";

// ─── Edit Workspace Modal ─────────────────────────────────────────────────────

interface EditModalProps {
  workspace: WorkspaceRow;
  onClose: () => void;
  onSaved: () => void;
}

const EditWorkspaceModal: React.FC<EditModalProps> = ({ workspace, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: workspace.name || '',
    business_email: workspace.business_email || '',
    business_phone: workspace.business_phone || '',
    status: workspace.status || 'Active',
    access_period: workspace.access_period || '1 Month',
    is_lifetime: workspace.is_lifetime || false,
    expiry_date: workspace.expiry_date ? workspace.expiry_date.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates: any = {
        name: form.name,
        business_email: form.business_email,
        business_phone: form.business_phone,
        status: form.status,
        is_lifetime: form.is_lifetime,
        access_period: form.is_lifetime ? 'Lifetime' : form.access_period,
        expiry_date: form.is_lifetime ? null : (form.expiry_date || null),
        updated_at: new Date().toISOString(),
      };
      const { error: err } = await supabase!.from('workspaces').update(updates).eq('id', workspace.id);
      if (err) throw err;
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Workspace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Business Name" required>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Business Email">
            <input type="email" value={form.business_email} onChange={e => setForm({ ...form, business_email: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Business Phone">
            <input type="text" value={form.business_phone} onChange={e => setForm({ ...form, business_phone: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Disabled">Disabled</option>
              <option value="Expired">Expired</option>
            </select>
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edit_lifetime" checked={form.is_lifetime}
              onChange={e => setForm({ ...form, is_lifetime: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="edit_lifetime" className="text-sm font-medium text-gray-700 dark:text-gray-300">Lifetime Access</label>
          </div>
          {!form.is_lifetime && (
            <>
              <Field label="Access Period">
                <select value={form.access_period} onChange={e => setForm({ ...form, access_period: e.target.value })} className={inputCls}>
                  <option>1 Month</option>
                  <option>6 Months</option>
                  <option>12 Months</option>
                </select>
              </Field>
              <Field label="Expiry Date">
                <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className={inputCls} />
              </Field>
            </>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Extend Access Modal ──────────────────────────────────────────────────────

const ExtendAccessModal: React.FC<{ workspace: WorkspaceRow; onClose: () => void; onSaved: () => void }> = ({ workspace, onClose, onSaved }) => {
  const [period, setPeriod] = useState('1 Month');
  const [isLifetime, setIsLifetime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const calcExpiry = () => {
    if (isLifetime) return null;
    const base = new Date();
    if (period === '1 Month') base.setMonth(base.getMonth() + 1);
    else if (period === '6 Months') base.setMonth(base.getMonth() + 6);
    else if (period === '12 Months') base.setFullYear(base.getFullYear() + 1);
    return base.toISOString();
  };

  const handleExtend = async () => {
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase!.rpc('admin_extend_workspace_access', {
        p_workspace_id: workspace.id,
        p_access_period: isLifetime ? 'Lifetime' : period,
        p_is_lifetime: isLifetime,
        p_new_expiry_date: calcExpiry(),
      });
      if (err) throw err;
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to extend access');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Extend Access Period</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
            <p className="font-medium text-gray-900 dark:text-white">{workspace.name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Current: {workspace.is_lifetime ? 'Lifetime' : workspace.access_period} • Expires: {fmtDate(workspace.expiry_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ext_lifetime" checked={isLifetime}
              onChange={e => setIsLifetime(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="ext_lifetime" className="text-sm font-medium text-gray-700 dark:text-gray-300">Convert to Lifetime</label>
          </div>
          {!isLifetime && (
            <Field label="New Access Period">
              <select value={period} onChange={e => setPeriod(e.target.value)} className={inputCls}>
                <option>1 Month</option>
                <option>6 Months</option>
                <option>12 Months</option>
              </select>
            </Field>
          )}
          {!isLifetime && (
            <p className="text-sm text-gray-500 dark:text-gray-400">New expiry will be set to: <strong className="text-gray-900 dark:text-white">{fmtDate(calcExpiry() || '')}</strong></p>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">Cancel</button>
          <button onClick={handleExtend} disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Extending...</> : <><Timer className="w-4 h-4" /> Extend Access</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}> = ({ title, message, confirmLabel, danger, onConfirm, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (e: any) {
      setError(e.message || 'Operation failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
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

// ─── 4-Step Create Wizard ─────────────────────────────────────────────────────

interface WizardData {
  // Step 1
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessCategory: string;
  internalNotes: string;
  // Step 2
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerConfirmPassword: string;
  // Step 3
  accessPeriod: string;
  isLifetime: boolean;
  activationDate: string;
  expiryDate: string;
}

const getExpiryDate = (period: string, isLifetime: boolean, activation: string): string => {
  if (isLifetime) return '';
  const base = new Date(activation);
  if (period === '1 Month') base.setMonth(base.getMonth() + 1);
  else if (period === '6 Months') base.setMonth(base.getMonth() + 6);
  else if (period === '12 Months') base.setFullYear(base.getFullYear() + 1);
  return base.toISOString();
};

const getDaysRemaining = (expiry: string, isLifetime: boolean): string => {
  if (isLifetime) return 'Lifetime (Never expires)';
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  return `${days} days`;
};

interface CreateWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateWizard: React.FC<CreateWizardProps> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<WizardData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [data, setData] = useState<WizardData>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessCategory: '',
    internalNotes: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerConfirmPassword: '',
    accessPeriod: '1 Month',
    isLifetime: false,
    activationDate: today,
    expiryDate: getExpiryDate('1 Month', false, today),
  });

  const set = (k: keyof WizardData, v: any) => {
    setData(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'accessPeriod' || k === 'isLifetime' || k === 'activationDate') {
        next.expiryDate = getExpiryDate(next.accessPeriod, next.isLifetime, next.activationDate);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validateStep1 = () => {
    const e: Partial<WizardData> = {};
    if (!data.businessName.trim()) e.businessName = 'Required';
    if (!data.businessEmail.trim()) e.businessEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.businessEmail)) e.businessEmail = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<WizardData> = {};
    if (!data.ownerName.trim()) e.ownerName = 'Required';
    if (!data.ownerEmail.trim()) e.ownerEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail)) e.ownerEmail = 'Invalid email';
    if (!data.ownerPassword) e.ownerPassword = 'Required';
    else if (data.ownerPassword.length < 8) e.ownerPassword = 'Minimum 8 characters';
    if (!data.ownerConfirmPassword) e.ownerConfirmPassword = 'Required';
    else if (data.ownerPassword !== data.ownerConfirmPassword) e.ownerConfirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleProvision = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const { error } = await supabase!.rpc('provision_workspace', {
        p_business_name: data.businessName,
        p_business_email: data.businessEmail,
        p_business_phone: data.businessPhone || null,
        p_business_address: data.businessAddress || null,
        p_business_category: data.businessCategory || null,
        p_internal_notes: data.internalNotes || null,
        p_owner_name: data.ownerName,
        p_owner_email: data.ownerEmail,
        p_owner_password: data.ownerPassword,
        p_access_period: data.isLifetime ? 'Lifetime' : data.accessPeriod,
        p_is_lifetime: data.isLifetime,
        p_activation_date: new Date(data.activationDate).toISOString(),
        p_expiry_date: data.isLifetime ? null : (data.expiryDate || null),
      });

      if (error) throw error;
      onCreated();
    } catch (e: any) {
      setSubmitError(e.message || 'Provisioning failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { label: 'Business Info', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Owner Account', icon: <User className="w-5 h-5" /> },
    { label: 'Access Period', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Review', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[95vh] animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Workspace</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Step {step} of 4 — {steps[step - 1].label}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30 shrink-0">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <WizardStep step={i + 1} current={step} label={s.label} icon={i + 1} />
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 max-w-12 ${step > i + 1 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'} transition-colors`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Business Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business Name" required error={errors.businessName}>
                  <input type="text" value={data.businessName} onChange={e => set('businessName', e.target.value)}
                    className={`${inputCls} ${errors.businessName ? 'border-red-400' : ''}`}
                    placeholder="e.g. Ahmed Electronics" />
                </Field>
                <Field label="Business Email" required error={errors.businessEmail}>
                  <input type="email" value={data.businessEmail} onChange={e => set('businessEmail', e.target.value)}
                    className={`${inputCls} ${errors.businessEmail ? 'border-red-400' : ''}`}
                    placeholder="business@example.com" />
                </Field>
                <Field label="Business Phone" error={errors.businessPhone}>
                  <input type="text" value={data.businessPhone} onChange={e => set('businessPhone', e.target.value)}
                    className={inputCls} placeholder="+92 300 0000000" />
                </Field>
                <Field label="Business Category" error={errors.businessCategory}>
                  <select value={data.businessCategory} onChange={e => set('businessCategory', e.target.value)} className={inputCls}>
                    <option value="">Select category...</option>
                    <option>Retail</option>
                    <option>Grocery / General Store</option>
                    <option>Electronics</option>
                    <option>Clothing & Fashion</option>
                    <option>Restaurant / Café</option>
                    <option>Pharmacy</option>
                    <option>Hardware / Building Materials</option>
                    <option>Wholesale</option>
                    <option>Services</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Business Address">
                <textarea value={data.businessAddress} onChange={e => set('businessAddress', e.target.value)}
                  className={`${inputCls} resize-none`} rows={2} placeholder="Street, City, Country" />
              </Field>
              <Field label="Internal Notes" hint="Only visible to Platform Admins">
                <textarea value={data.internalNotes} onChange={e => set('internalNotes', e.target.value)}
                  className={`${inputCls} resize-none`} rows={2} placeholder="Any notes about this workspace..." />
              </Field>
            </div>
          )}

          {/* STEP 2: Owner Account */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-300">
                This account will be the workspace Admin. The owner will use these credentials to log in.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.ownerName}>
                  <input type="text" value={data.ownerName} onChange={e => set('ownerName', e.target.value)}
                    className={`${inputCls} ${errors.ownerName ? 'border-red-400' : ''}`}
                    placeholder="Ahmed Khan" />
                </Field>
                <Field label="Email Address" required error={errors.ownerEmail}>
                  <input type="email" value={data.ownerEmail} onChange={e => set('ownerEmail', e.target.value)}
                    className={`${inputCls} ${errors.ownerEmail ? 'border-red-400' : ''}`}
                    placeholder="owner@business.com" />
                </Field>
                <Field label="Password" required error={errors.ownerPassword}>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={data.ownerPassword}
                      onChange={e => set('ownerPassword', e.target.value)}
                      className={`${inputCls} pr-10 ${errors.ownerPassword ? 'border-red-400' : ''}`}
                      placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password" required error={errors.ownerConfirmPassword}>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={data.ownerConfirmPassword}
                      onChange={e => set('ownerConfirmPassword', e.target.value)}
                      className={`${inputCls} pr-10 ${errors.ownerConfirmPassword ? 'border-red-400' : ''}`}
                      placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Role Assigned</p>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">Admin</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Status</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">Active</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Access Period */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="wiz_lifetime" checked={data.isLifetime}
                  onChange={e => set('isLifetime', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                <label htmlFor="wiz_lifetime" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Infinity className="w-4 h-4 text-indigo-500" /> Lifetime Access (Never expires)
                </label>
              </div>

              {!data.isLifetime && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Access Period</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '1 Month', desc: '30 days' },
                      { label: '6 Months', desc: '180 days' },
                      { label: '12 Months', desc: '365 days' },
                    ].map(opt => (
                      <button key={opt.label} type="button"
                        onClick={() => set('accessPeriod', opt.label)}
                        className={`p-4 rounded-xl border-2 text-center transition-all
                          ${data.accessPeriod === opt.label
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                        <p className={`font-bold text-lg ${data.accessPeriod === opt.label ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>{opt.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 dark:bg-[#0d1117] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-1">Activation Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{fmtDate(new Date(data.activationDate).toISOString())}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0d1117] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-1">Expiry Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{data.isLifetime ? 'Never' : fmtDate(data.expiryDate)}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 uppercase font-semibold tracking-wider mb-1">Days Remaining</p>
                  <p className="font-bold text-indigo-700 dark:text-indigo-300">{getDaysRemaining(data.expiryDate, data.isLifetime)}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#0d1117] px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Building2 className="w-4 h-4" /> Business Information</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Business Name', data.businessName],
                    ['Business Email', data.businessEmail],
                    ['Phone', data.businessPhone || '—'],
                    ['Category', data.businessCategory || '—'],
                    ['Address', data.businessAddress || '—'],
                    ['Internal Notes', data.internalNotes || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{k}</p>
                      <p className="font-medium text-gray-900 dark:text-white break-words">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#0d1117] px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><User className="w-4 h-4" /> Owner Account</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Full Name', data.ownerName],
                    ['Email', data.ownerEmail],
                    ['Role', 'Admin'],
                    ['Status', 'Active'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{k}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#0d1117] px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar className="w-4 h-4" /> Access Period</h4>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3 text-sm">
                  {[
                    ['Plan', data.isLifetime ? 'Lifetime' : data.accessPeriod],
                    ['Activation', fmtDate(new Date(data.activationDate).toISOString())],
                    ['Expiry', data.isLifetime ? 'Never' : fmtDate(data.expiryDate)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{k}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">Provisioning Failed</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{submitError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/30 shrink-0">
          <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <button onClick={handleNext}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 shadow-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleProvision} disabled={submitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-md">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Provision Workspace</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Workspaces Component ────────────────────────────────────────────────

type ActionModal =
  | { type: 'edit'; workspace: WorkspaceRow }
  | { type: 'extend'; workspace: WorkspaceRow }
  | { type: 'confirm'; workspace: WorkspaceRow; action: string; title: string; message: string; danger?: boolean }
  | null;

const Workspaces: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase!
        .from('workspaces')
        .select('id, name, slug, logo_url, status, access_period, activation_date, expiry_date, is_lifetime, created_at, business_email, business_phone, deleted_at, users!users_workspace_id_fkey(id, name, email, role)', { count: 'exact' });

      if (showDeleted) {
        query = query.not('deleted_at', 'is', null);
      } else {
        query = query.is('deleted_at', null);
      }

      // Status filter
      if (filterStatus !== 'All') {
        query = query.eq('status', filterStatus);
      }

      // Period filter
      if (filterPeriod !== 'All') {
        if (filterPeriod === 'Lifetime') query = query.eq('is_lifetime', true);
        else query = query.eq('access_period', filterPeriod).eq('is_lifetime', false);
      }

      // Search (name, id, email, phone)
      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`name.ilike.%${term}%,business_email.ilike.%${term}%,business_phone.ilike.%${term}%,slug.ilike.%${term}%`);
      }

      // Sort
      query = query.order(sortField, { ascending: sortDir === 'asc' });

      // Pagination
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error: err, count } = await query;
      if (err) throw err;

      const rows: WorkspaceRow[] = (data || []).map((w: any) => {
        const ownerUser = w.users?.find((u: any) => u.role === 'Admin' || u.role === 'Owner') || w.users?.[0];
        return {
          ...w,
          owner_name: ownerUser?.name || 'Unknown',
          owner_email: ownerUser?.email || w.business_email || '—',
          employee_count: w.users?.length || 0,
        };
      });

      setWorkspaces(rows);
      setTotalCount(count ?? 0);
    } catch (e: any) {
      console.error('Fetch workspaces error:', e);
      setError(e.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortDir, filterStatus, filterPeriod, showDeleted, searchTerm]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortField === field ? 'text-indigo-500' : 'text-gray-400'}`} />
  );

  const performAction = async (workspace: WorkspaceRow, action: string) => {
    switch (action) {
      case 'Activate':
        await supabase!.rpc('admin_update_workspace_status', { p_workspace_id: workspace.id, p_status: 'Active' });
        break;
      case 'Suspend':
        await supabase!.rpc('admin_update_workspace_status', { p_workspace_id: workspace.id, p_status: 'Suspended' });
        break;
      case 'Disable':
        await supabase!.rpc('admin_update_workspace_status', { p_workspace_id: workspace.id, p_status: 'Disabled' });
        break;
      case 'Delete':
        await supabase!.rpc('admin_hard_delete_workspace', { p_workspace_id: workspace.id });
        break;
      case 'Restore':
        await supabase!.rpc('admin_restore_workspace', { p_workspace_id: workspace.id });
        break;
      default:
        throw new Error('Unknown action');
    }
    fetchWorkspaces();
    setActionModal(null);
  };

  const openConfirm = (workspace: WorkspaceRow, action: string) => {
    const configs: Record<string, { title: string; message: string; danger?: boolean }> = {
      Activate:  { title: 'Activate Workspace',  message: `Activate "${workspace.name}"? Users will regain access.` },
      Suspend:   { title: 'Suspend Workspace',   message: `Suspend "${workspace.name}"? Users will lose access.`, danger: true },
      Disable:   { title: 'Disable Workspace',   message: `Disable "${workspace.name}"? This is stricter than suspension.`, danger: true },
      Delete:    { title: 'Delete Workspace',    message: `Permanently delete "${workspace.name}"? All data will be wiped and cannot be restored.`, danger: true },
      Restore:   { title: 'Restore Workspace',   message: `Restore "${workspace.name}"? It will become Active.` },
    };
    const cfg = configs[action];
    if (!cfg) return;
    setActionModal({ type: 'confirm', workspace, action, ...cfg });
    setActionMenuOpen(null);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col h-full animate-fade-in" onClick={() => setActionMenuOpen(null)}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Workspaces</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? 'Loading...' : `${totalCount.toLocaleString()} workspace${totalCount !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowDeleted(!showDeleted); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2
              ${showDeleted ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400' : 'bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <Trash2 className="w-4 h-4" />
            {showDeleted ? 'Deleted' : 'Show Deleted'}
          </button>
          <button onClick={fetchWorkspaces} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Create Workspace
          </button>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone, ID..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer font-medium">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
            <option value="Disabled">Disabled</option>
          </select>
          <select value={filterPeriod} onChange={e => { setFilterPeriod(e.target.value); setPage(1); }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer font-medium">
            <option value="All">All Periods</option>
            <option value="1 Month">1 Month</option>
            <option value="6 Months">6 Months</option>
            <option value="12 Months">12 Months</option>
            <option value="Lifetime">Lifetime</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-sm min-h-0">
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/80 dark:bg-[#0d1117]/80 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors whitespace-nowrap" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">Business <SortIcon field="name" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors whitespace-nowrap" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Access Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors whitespace-nowrap hidden lg:table-cell" onClick={() => handleSort('expiry_date')}>
                  <div className="flex items-center gap-1.5">Days Left <SortIcon field="expiry_date" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">Employees</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors whitespace-nowrap hidden xl:table-cell" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1.5">Created <SortIcon field="created_at" /></div>
                </th>
                <th className="px-4 py-3 relative"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#161b22]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800" /><div className="space-y-1.5"><div className="h-3.5 w-36 bg-gray-200 dark:bg-gray-800 rounded" /><div className="h-2.5 w-24 bg-gray-100 dark:bg-gray-700 rounded" /></div></div></td>
                    <td className="px-4 py-4 hidden md:table-cell"><div className="space-y-1.5"><div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-800 rounded" /><div className="h-2.5 w-36 bg-gray-100 dark:bg-gray-700 rounded" /></div></td>
                    <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded" /></td>
                    <td className="px-4 py-4 hidden xl:table-cell"><div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded" /></td>
                    <td className="px-4 py-4 hidden xl:table-cell"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" /></td>
                    <td className="px-4 py-4" />
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <XCircle className="w-7 h-7 text-red-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Failed to Load</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{error}</p>
                      <button onClick={fetchWorkspaces} className="mt-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : workspaces.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No workspaces found</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new workspace.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                workspaces.map(ws => {
                  const days = calcDaysRemaining(ws.expiry_date, ws.is_lifetime);
                  const daysNum = typeof days === 'number' ? days : null;
                  const daysColor = daysNum !== null && daysNum <= 0 ? 'text-red-600 dark:text-red-400 font-bold' :
                    daysNum !== null && daysNum <= 7 ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                    'text-gray-900 dark:text-white';

                  return (
                    <tr key={ws.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/adminpanel/workspaces/${ws.id}`)}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                            {ws.logo_url ? <img src={ws.logo_url} alt="" className="w-full h-full object-cover" /> : ws.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ws.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5" title={ws.id}>{ws.id.substring(0, 12)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{ws.owner_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ws.owner_email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={ws.status} /></td>
                      <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{ws.is_lifetime ? <span className="flex items-center gap-1"><Infinity className="w-3.5 h-3.5 text-indigo-500" /> Lifetime</span> : ws.access_period}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Since {fmtDate(ws.activation_date)}</div>
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap hidden lg:table-cell text-sm ${daysColor}`}>
                        {ws.is_lifetime ? <Infinity className="w-4 h-4 text-indigo-500" /> : days}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden xl:table-cell text-sm text-gray-900 dark:text-white font-medium">
                        {ws.employee_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden xl:table-cell text-xs text-gray-500 dark:text-gray-400">
                        {fmtDate(ws.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right relative">
                        <button
                          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          onClick={e => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === ws.id ? null : ws.id); }}>
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {/* Action Dropdown */}
                        {actionMenuOpen === ws.id && (
                          <div className="absolute right-10 top-2 w-52 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-20 py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { navigate(`/adminpanel/workspaces/${ws.id}`); setActionMenuOpen(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors">
                              <Eye className="w-4 h-4 text-gray-500" /> View Details
                            </button>
                            <button onClick={() => { setActionModal({ type: 'edit', workspace: ws }); setActionMenuOpen(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors">
                              <Edit className="w-4 h-4 text-blue-500" /> Edit
                            </button>
                            <button onClick={() => { setActionModal({ type: 'extend', workspace: ws }); setActionMenuOpen(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors">
                              <Timer className="w-4 h-4 text-indigo-500" /> Extend Access
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                            {ws.status !== 'Active' && (
                              <button onClick={() => openConfirm(ws, 'Activate')} className="w-full text-left px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors">
                                <Power className="w-4 h-4" /> Activate
                              </button>
                            )}
                            {ws.status === 'Active' && (
                              <button onClick={() => openConfirm(ws, 'Suspend')} className="w-full text-left px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2.5 transition-colors">
                                <AlertTriangle className="w-4 h-4" /> Suspend
                              </button>
                            )}
                            <button onClick={() => openConfirm(ws, 'Disable')} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors">
                              <PowerOff className="w-4 h-4" /> Disable
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                            {ws.deleted_at ? (
                              <button onClick={() => openConfirm(ws, 'Restore')} className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors">
                                <RotateCcw className="w-4 h-4" /> Restore
                              </button>
                            ) : (
                              <button onClick={() => openConfirm(ws, 'Delete')} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 bg-gray-50/50 dark:bg-[#0d1117]/50">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-[#161b22] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pageNum === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-[#161b22] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateWizard && (
        <CreateWizard
          onClose={() => setShowCreateWizard(false)}
          onCreated={() => { setShowCreateWizard(false); fetchWorkspaces(); }}
        />
      )}

      {actionModal?.type === 'edit' && (
        <EditWorkspaceModal
          workspace={actionModal.workspace}
          onClose={() => setActionModal(null)}
          onSaved={() => { setActionModal(null); fetchWorkspaces(); }}
        />
      )}

      {actionModal?.type === 'extend' && (
        <ExtendAccessModal
          workspace={actionModal.workspace}
          onClose={() => setActionModal(null)}
          onSaved={() => { setActionModal(null); fetchWorkspaces(); }}
        />
      )}

      {actionModal?.type === 'confirm' && (
        <ConfirmDialog
          title={actionModal.title}
          message={actionModal.message}
          confirmLabel={actionModal.action}
          danger={actionModal.danger}
          onConfirm={() => performAction(actionModal.workspace, actionModal.action)}
          onClose={() => setActionModal(null)}
        />
      )}
    </div>
  );
};

export default Workspaces;
