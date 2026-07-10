import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User as UserIcon,
  Shield,
  Key,
  Smartphone,
  Globe,
  Settings as SettingsIcon,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  Building,
  Users as UsersIcon,
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  DollarSign,
  Plus,
  ArrowRight,
  Eye,
  Activity as ActivityIcon,
  Bell,
  Download,
  Check,
  Camera,
  AlertCircle,
  Code,
  Lock,
  Moon,
  Sun,
  Layout,
  Maximize2,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useSettingsStore } from '../stores/settingsStore';
import { usePOSStore } from '../stores/posStore';
import { useCustomerStore } from '../stores/customersStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useExpensesStore } from '../stores/expensesStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import authService from '../services/authService';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';
import { StaffManagementPanel } from '../components/StaffManagementPanel';
import LoadingButton from '../components/LoadingButton';

const AccountCenter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Stores
  const { user, updateUserProfile } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { shopSettings, updateShopSettings } = useSettingsStore();
  const { sales } = usePOSStore();
  const { customers } = useCustomerStore();
  const { products } = useInventoryStore();
  const { expenses } = useExpensesStore();
  const { purchaseOrders } = usePurchaseStore();

  // Local state
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [staffCount, setStaffCount] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Edit Form Fields
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editJobTitle, setEditJobTitle] = useState(user?.jobTitle || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editTimeZone, setEditTimeZone] = useState(user?.timeZone || 'UTC+5');
  const [editLanguage, setEditLanguage] = useState(user?.preferredLanguage || 'en');
  const [avatarBase64, setAvatarBase64] = useState(user?.profilePhoto || '');

  useEffect(() => {
    const fetchStaffCount = async () => {
      try {
        const users = await authService.getUsers();
        setStaffCount(users.length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStaffCount();
  }, []);

  // Update local fields when user state loads/changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditJobTitle(user.jobTitle || '');
      setEditBio(user.bio || '');
      setEditTimeZone(user.timeZone || 'UTC+5');
      setEditLanguage(user.preferredLanguage || 'en');
      setAvatarBase64(user.profilePhoto || '');
    }
  }, [user]);

  // Statistics calculation
  const totalSalesRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.finalAmount, 0);
  }, [sales]);

  const totalExpensesRevenue = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const kpis = useMemo(() => {
    return [
      {
        title: 'Sales Created',
        value: sales.length,
        description: `PKR ${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: ShoppingCart,
        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
      },
      {
        title: 'Products Added',
        value: products.length,
        description: 'Items in catalog',
        icon: Package,
        color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
      },
      {
        title: 'Customers Added',
        value: customers.length,
        description: 'Registered users',
        icon: UsersIcon,
        color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
      },
      {
        title: 'Purchase Orders',
        value: purchaseOrders.length,
        description: 'Vendor procurements',
        icon: FileText,
        color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
      },
      {
        title: 'Expenses Recorded',
        value: expenses.length,
        description: `PKR ${totalExpensesRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
      },
      {
        title: 'Reports Generated',
        value: Math.max(12, sales.length + products.length > 0 ? 5 : 2), // Mock reports compiled
        description: 'SaaS Analytics logs',
        icon: TrendingUp,
        color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
      }
    ];
  }, [sales, products, customers, purchaseOrders, expenses, totalSalesRevenue, totalExpensesRevenue]);

  // Combined timeline events from existing DB data
  const timelineEvents = useMemo(() => {
    const list: {
      id: string;
      type: 'sale' | 'product' | 'purchase' | 'expense' | 'login' | 'system';
      title: string;
      desc: string;
      time: Date;
    }[] = [];

    // Sales events
    sales.slice(0, 3).forEach(s => {
      list.push({
        id: `sale-${s.id}`,
        type: 'sale',
        title: 'Completed Sale',
        desc: `Sale #${s.id} created for PKR ${s.finalAmount.toLocaleString()}`,
        time: s.createdAt ? new Date(s.createdAt) : new Date()
      });
    });

    // Product events
    products.slice(0, 3).forEach(p => {
      list.push({
        id: `product-${p.id}`,
        type: 'product',
        title: 'New Product Added',
        desc: `Added product ${p.name} at PKR ${p.price}`,
        time: p.createdAt ? new Date(p.createdAt) : new Date()
      });
    });

    // Purchase orders
    purchaseOrders.slice(0, 2).forEach(po => {
      list.push({
        id: `po-${po.id}`,
        type: 'purchase',
        title: 'Purchase Order Issued',
        desc: `PO #${po.purchaseNumber || po.id} created for supplier ${po.supplierName}`,
        time: po.createdAt ? new Date(po.createdAt) : new Date()
      });
    });

    // Expenses
    expenses.slice(0, 2).forEach(e => {
      list.push({
        id: `exp-${e.id}`,
        type: 'expense',
        title: 'Expense Logged',
        desc: `Recorded PKR ${e.amount.toLocaleString()} under ${e.category}`,
        time: e.createdAt ? new Date(e.createdAt) : new Date()
      });
    });

    // Login Activity
    if (user?.lastActive) {
      list.push({
        id: 'login-act',
        type: 'login',
        title: 'User Authenticated',
        desc: `Logged in from Swat, Pakistan (Last active session)`,
        time: new Date(user.lastActive)
      });
    }

    // Sort by date desc
    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);
  }, [sales, products, purchaseOrders, expenses, user]);

  // Avatar uploader
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSaveError('Avatar image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        name: editName,
        phone: editPhone,
        jobTitle: editJobTitle,
        bio: editBio,
        timeZone: editTimeZone,
        preferredLanguage: editLanguage,
        profilePhoto: avatarBase64
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update personal information');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Preference update helpers
  const handlePreferenceChange = async (key: string, value: any) => {
    try {
      const updated = {
        ...shopSettings,
        [key]: value
      };
      await updateShopSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update shop setting preference:', err);
    }
  };

  // Export User Personal Data
  const handleExportData = () => {
    const userData = {
      user: {
        id: user?.id,
        username: user?.username,
        role: user?.role,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        jobTitle: user?.jobTitle,
        timeZone: user?.timeZone,
        bio: user?.bio,
        createdAt: user?.createdAt,
        lastActive: user?.lastActive
      },
      stats: {
        totalSales: sales.length,
        totalPurchases: purchaseOrders.length,
        totalExpenses: expenses.length,
        totalCustomersAdded: customers.length
      }
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_profile_data_${user?.username}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. Header Overview Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Large Premium Avatar */}
          <div className="relative group">
            <div className="h-24 w-24 rounded-2xl bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/10 transition-transform duration-300 group-hover:scale-105">
              {avatarBase64 ? (
                <img src={avatarBase64} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-indigo-400 uppercase">
                  {user?.username?.substring(0, 2) || 'CP'}
                </span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl border border-slate-700/80 cursor-pointer shadow-md transition-colors">
              <Camera className="h-4 w-4" />
              <input type="file" onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </label>
          </div>

          {/* User Meta Data */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || user?.username}</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {user?.role || 'Admin'}
              </span>
              {user?.jobTitle && (
                <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {user.jobTitle}
                </span>
              )}
            </div>
            
            <p className="text-slate-400 text-sm max-w-xl line-clamp-2">
              {user?.bio || 'No workspace description or personal bio provided yet. Add one in the Personal Details form below.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-400 font-medium">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <span>{user?.email || 'no-email@counterpro.com'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-3.5 w-3.5 text-indigo-400" />
                <span>{user?.phone || 'No phone record'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Building className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate">Workspace: {shopSettings.name}</span>
              </div>
            </div>
          </div>

          {/* User dates details */}
          <div className="border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6 text-center md:text-left text-xs text-slate-400 space-y-1.5 shrink-0 self-center">
            <div>
              <span className="text-slate-500">Member since: </span>
              <span className="font-semibold text-slate-300">
                {user?.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy') : '01 July 2026'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Last activity: </span>
              <span className="font-semibold text-slate-300">
                {user?.lastActive ? format(new Date(user.lastActive), 'dd MMM yyyy, hh:mm a') : 'Now'}
              </span>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition duration-200"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Left stats & details, Right summary & activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Editing details, quick statistic cards & preferences */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Edit / Details Section */}
          {isEditing ? (
            <ContentCard
              title="Personal Information"
              subtitle="Update your contact details, avatar, bio, and localization values."
            >

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Ahmed Khan"
                      className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      placeholder="e.g. General Manager"
                      className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Time Zone
                    </label>
                    <select
                      value={editTimeZone}
                      onChange={(e) => setEditTimeZone(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="UTC+5">PKT (UTC+5)</option>
                      <option value="UTC+0">GMT (UTC+0)</option>
                      <option value="UTC-5">EST (UTC-5)</option>
                      <option value="UTC+1">CET (UTC+1)</option>
                      <option value="UTC+8">SGT (UTC+8)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Short Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write a short summary about your roles, actions and business experience..."
                      rows={3}
                      className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-slate-800 dark:text-white transition"
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    type="submit"
                    isLoading={isSavingProfile}
                    loadingText="Saving..."
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save Details
                  </LoadingButton>
                </div>
              </form>
            </ContentCard>
          ) : null}

          {/* Quick Statistics KPI Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-gray-500">
              Quick Statistics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition duration-300 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <div className={`${kpi.color} p-2 rounded-xl`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                        {kpi.value}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 leading-snug">{kpi.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 truncate mt-0.5">{kpi.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tab Sub-controls: preferences, security architecture info */}
          <ContentCard>
            <div className="flex border-b border-slate-100 dark:border-gray-700/80 pb-1 mb-6 gap-6 text-sm font-bold">
              <button
                onClick={() => setActiveSubTab('profile')}
                className={`pb-3 relative transition-colors ${activeSubTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'}`}
              >
                Preferences
                {activeSubTab === 'profile' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveSubTab('security')}
                className={`pb-3 relative transition-colors ${activeSubTab === 'security' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'}`}
              >
                Security & Devices (Future Ready)
                {activeSubTab === 'security' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
              </button>
            </div>

            {/* Sub-tab: Preferences */}
            {activeSubTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Theme preference */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Mode Interface</p>
                      <p className="text-[10px] text-slate-400">Reduce eye strain under dark work layouts.</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`p-2.5 rounded-xl border transition ${isDarkMode ? 'bg-indigo-600 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'}`}
                    >
                      {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Table Density */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Table Row Density</p>
                      <p className="text-[10px] text-slate-400">Controls size padding in reports tables.</p>
                    </div>
                    <select
                      value={shopSettings.tableDensity || 'comfortable'}
                      onChange={(e) => handlePreferenceChange('tableDensity', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="compact">Compact (Minimal padding)</option>
                      <option value="comfortable">Comfortable (Standard padding)</option>
                      <option value="cozy">Cozy (Wide spacing)</option>
                    </select>
                  </div>

                  {/* Landing page Preference */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Default Landing Route</p>
                      <p className="text-[10px] text-slate-400">Page redirected automatically after logging in.</p>
                    </div>
                    <select
                      value={shopSettings.defaultLandingPage || '/'}
                      onChange={(e) => handlePreferenceChange('defaultLandingPage', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="/">Dashboard Summary</option>
                      <option value="/pos">POS Sales Screen</option>
                      <option value="/inventory">Inventory Catalog</option>
                      <option value="/customers">Customer Registry</option>
                    </select>
                  </div>

                  {/* Dashboard layout */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dashboard Layout (Future-Ready)</p>
                      <p className="text-[10px] text-slate-400">Display configuration for visual widgets.</p>
                    </div>
                    <select
                      disabled
                      value="grid"
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-100 dark:bg-gray-800 text-xs text-slate-400 dark:text-gray-500 cursor-not-allowed outline-none"
                    >
                      <option value="grid">Grid (Standard Cards)</option>
                      <option value="list">Compact List Overview</option>
                      <option value="charts">Analytics Heavy Panels</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Security Architecture Info */}
            {activeSubTab === 'security' && (
              <div className="space-y-6">
                
                {/* Supabase authentication and multi tenant placeholder info alert */}
                <div className="flex gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 rounded-2xl p-4">
                  <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Cloud Authentication Architecture</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed">
                      Counter Pro is pre-configured to sync user tables with Supabase JWT logins. The local sqlite schemas map 1-to-1 with external metadata keys to support offline sync caches during transitions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Two-Factor Auth Placeholder */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-slate-400 mt-1 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Two-Factor Authentication (2FA)</p>
                      <p className="text-[10px] text-slate-400 leading-snug">Require auth verification code from Google Authenticator App.</p>
                      <span className="inline-block bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Disabled</span>
                    </div>
                  </div>

                  {/* Connected Accounts Placeholder */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 flex items-start gap-3">
                    <Globe className="h-5 w-5 text-slate-400 mt-1 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Connected SSO Accounts</p>
                      <p className="text-[10px] text-slate-400 leading-snug">Link your credentials to Google Workspace or Shopify Admin SSO.</p>
                      <span className="inline-block bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">None Linked</span>
                    </div>
                  </div>

                  {/* API Tokens Placeholder */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 flex items-start gap-3">
                    <Code className="h-5 w-5 text-slate-400 mt-1 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Developer API Keys</p>
                      <p className="text-[10px] text-slate-400 leading-snug">Generate tokens to push sales to external delivery aggregators.</p>
                      <span className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Sandbox Mode</span>
                    </div>
                  </div>

                  {/* Active Sessions Placeholder */}
                  <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-850 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-slate-400 mt-1 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Login Sessions</p>
                      <p className="text-[10px] text-slate-400 leading-snug">Manage other active browser sessions logged into this workspace.</p>
                      <span className="inline-block bg-indigo-500/15 text-indigo-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">1 Session Active</span>
                    </div>
                  </div>
                </div>

                {/* Connected Devices mock list */}
                <div className="space-y-3 border-t border-slate-100 dark:border-gray-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Active Devices</h4>
                  <div className="bg-slate-50/50 dark:bg-gray-900/50 rounded-2xl p-4 border border-slate-100 dark:border-gray-850 flex items-center justify-between">
                    <div className="flex gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Smartphone className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Windows Workstation</p>
                        <p className="text-[10px] text-slate-450">Chrome Browser • Swat, Pakistan (Current Session)</p>
                      </div>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-bold px-2 py-0.5 rounded">Active</span>
                  </div>
                </div>

              </div>
            )}
          </ContentCard>

          {/* Staff & Permissions Management (Only visible to Admin role) */}
          {(user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin') && (
            <StaffManagementPanel />
          )}

        </div>

        {/* Right Column (4 cols): Workspace Summary & Quick Actions & Timeline */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Workspace Summary Panel */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-gray-850 dark:to-indigo-950/5 rounded-3xl p-6 border border-slate-200/80 dark:border-gray-850 shadow-sm space-y-4">
            <div className="border-b border-slate-200/60 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-500" />
                Workspace Summary
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-gray-400">Multi-tenant ready enterprise core stats.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 dark:text-gray-400">Business Unit</span>
                <span className="font-bold text-slate-850 dark:text-white">{shopSettings.name}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 dark:text-gray-400">Authorized Role</span>
                <span className="bg-slate-200/60 dark:bg-gray-800/80 px-2 py-0.5 rounded-lg text-slate-800 dark:text-slate-200 font-bold uppercase text-[10px]">
                  {user?.role || 'Owner'}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 dark:text-gray-400">Staff Members</span>
                <span className="font-bold text-slate-850 dark:text-white">{staffCount} Users</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 dark:text-gray-400">Total Catalog Items</span>
                <span className="font-bold text-slate-850 dark:text-white">{products.length} Products</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 dark:text-gray-400">Active Contacts</span>
                <span className="font-bold text-slate-850 dark:text-white">{customers.length} Customers</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 dark:text-gray-400">Total Sales Value</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">PKR {totalSalesRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick navigation to related modules */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-gray-800 grid grid-cols-2 gap-2 text-xxs font-bold">
              <Link
                to="/dashboard/inventory"
                className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-slate-700 dark:text-slate-300"
              >
                <span>Products</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/dashboard/pos"
                className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-slate-700 dark:text-slate-300"
              >
                <span>POS Sale</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/dashboard/customers"
                className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-slate-700 dark:text-slate-300"
              >
                <span>Customers</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/dashboard/sales-history"
                className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-slate-700 dark:text-slate-300"
              >
                <span>History</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <ContentCard
            title="Quick Shortcuts"
          >
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                  // Scroll page to top to see edit form
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-gray-900 dark:hover:bg-gray-850 border border-slate-100 dark:border-gray-850 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-300 transition-all text-left"
              >
                <UserIcon className="h-4.5 w-4.5 text-indigo-500" />
                <div className="flex-1">
                  <p>Edit Personal Details</p>
                  <p className="text-[10px] text-slate-400 font-medium">Change name, phone and biography</p>
                </div>
              </button>

              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-gray-900 dark:hover:bg-gray-850 border border-slate-100 dark:border-gray-850 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-300 transition-all text-left"
              >
                <SettingsIcon className="h-4.5 w-4.5 text-indigo-500" />
                <div className="flex-1">
                  <p>Open ERP Settings</p>
                  <p className="text-[10px] text-slate-400 font-medium">Update tax and currency configurations</p>
                </div>
              </Link>

              <button
                onClick={handleExportData}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-gray-900 dark:hover:bg-gray-850 border border-slate-100 dark:border-gray-850 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-300 transition-all text-left"
              >
                <Download className="h-4.5 w-4.5 text-indigo-500" />
                <div className="flex-1">
                  <p>Export Personal Data</p>
                  <p className="text-[10px] text-slate-400 font-medium">Download full JSON profile & activities backup</p>
                </div>
              </button>

              <Link
                to="/notifications"
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-gray-900 dark:hover:bg-gray-850 border border-slate-100 dark:border-gray-850 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-300 transition-all text-left"
              >
                <Bell className="h-4.5 w-4.5 text-indigo-500" />
                <div className="flex-1">
                  <p>View System Notifications</p>
                  <p className="text-[10px] text-slate-400 font-medium">Read stock alerts and security logs</p>
                </div>
              </Link>
            </div>
          </ContentCard>

          {/* Activity Timeline */}
          <ContentCard
            title="Activity Timeline"
            subtitle="Audit logs tracking user state events."
          >

            <div className="relative pl-4 border-l border-slate-150 dark:border-gray-750 space-y-5 py-2">
              {timelineEvents.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Indicator dot */}
                  <span className="absolute -left-[20px] top-1 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-gray-800 group-hover:scale-125 transition-transform" />
                  
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-none">
                        {event.title}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-gray-500 shrink-0">
                        {format(event.time, 'hh:mm a')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-405 leading-relaxed">
                      {event.desc}
                    </p>
                  </div>
                </div>
              ))}

              {timelineEvents.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity detected.</p>
              )}
            </div>
          </ContentCard>

        </div>

      </div>
    </div>
  );
};

export default AccountCenter;
