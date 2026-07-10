import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, Palette, Globe, Percent, Printer, Barcode, 
  Database, RefreshCw, AlertTriangle, Shield, Save, Check, 
  Trash2, Plus, ArrowUpRight, ArrowDownLeft, ShieldAlert, Sparkles,
  Eye, FileText, Smartphone, LayoutGrid, CheckCircle2, Sliders, Settings as SettingsIcon,
  Bell, Users
} from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { StaffManagementPanel } from '../components/StaffManagementPanel';
import { SkuBarcodeSettingsPanel } from '../components/SkuBarcodeSettingsPanel';
import { useSettingsStore, defaultSettings } from '../stores/settingsStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import settingsService from '../services/settingsService';
import { generatePDFReceipt } from '../utils/pdfReceiptGenerator';
import { generateUrduPDFReceipt } from '../utils/urduPdfReceiptGenerator';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';

interface TaxRateItem {
  name: string;
  rate: number;
}

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { shopSettings, updateShopSettings, initializeFromDatabase } = useSettingsStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'localization' | 'tax' | 'barcode' | 'inventory' | 'pos' | 'backup' | 'data' | 'actions' | 'database' | 'notifications' | 'staff'>('profile');
  
  // Local Form State
  const [formState, setFormState] = useState(shopSettings);
  const [taxRates, setTaxRates] = useState<TaxRateItem[]>([]);
  const [newTaxRateName, setNewTaxRateName] = useState('');
  const [newTaxRateValue, setNewTaxRateValue] = useState(0);

  // Status indicators
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Destructive Actions Confirmations
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPrefConfirm, setShowPrefConfirm] = useState(false);

  // Database switch state
  const [currentDbType, setCurrentDbType] = useState(settingsService.getDatabaseType());

  useEffect(() => {
    setFormState(shopSettings);
    try {
      if (shopSettings.taxRatesJson) {
        setTaxRates(JSON.parse(shopSettings.taxRatesJson));
      } else {
        setTaxRates([]);
      }
    } catch (e) {
      setTaxRates([]);
    }
  }, [shopSettings]);

  const handleInputChange = (field: keyof typeof shopSettings, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      // Serialize tax rates
      const updatedForm = {
        ...formState,
        taxRatesJson: JSON.stringify(taxRates)
      };

      await updateShopSettings(updatedForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save settings.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add tax rate helper
  const addTaxRate = () => {
    if (!newTaxRateName.trim()) return;
    const newRates = [...taxRates, { name: newTaxRateName, rate: newTaxRateValue }];
    setTaxRates(newRates);
    setNewTaxRateName('');
    setNewTaxRateValue(0);
  };

  // Delete tax rate helper
  const removeTaxRate = (index: number) => {
    const newRates = taxRates.filter((_, i) => i !== index);
    setTaxRates(newRates);
  };

  // File imports
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setActionSuccessMessage('');
    setActionErrorMessage('');

    try {
      await settingsService.importData(file);
      useNotificationsStore.getState().addManualNotification({
        title: 'Import Completed',
        message: `Database imported successfully from "${file.name}".`,
        type: 'success',
        module: 'system'
      });
      setActionSuccessMessage('Application data imported successfully! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setActionErrorMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setActionSuccessMessage('');
    setActionErrorMessage('');

    try {
      await settingsService.importSettings(file);
      useNotificationsStore.getState().addManualNotification({
        title: 'Import Completed',
        message: `Settings imported successfully from "${file.name}".`,
        type: 'success',
        module: 'system'
      });
      await initializeFromDatabase();
      setActionSuccessMessage('Settings imported successfully!');
      setTimeout(() => setActionSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setActionErrorMessage(err instanceof Error ? err.message : 'Settings import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Action triggers
  const triggerExportBackup = async () => {
    try {
      await settingsService.exportData();
      useNotificationsStore.getState().addManualNotification({
        title: 'Backup Completed',
        message: 'Application database backup exported successfully.',
        type: 'success',
        module: 'system'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to export data');
    }
  };

  const triggerExportSettings = async () => {
    try {
      await settingsService.exportSettings();
      useNotificationsStore.getState().addManualNotification({
        title: 'Export Completed',
        message: 'Application settings backup exported successfully.',
        type: 'success',
        module: 'system'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to export settings');
    }
  };

  const triggerResetPreferences = async () => {
    setIsProcessing(true);
    try {
      await settingsService.resetPreferences();
      await initializeFromDatabase();
      setActionSuccessMessage('Preferences reset to default values');
      setTimeout(() => setActionSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setActionErrorMessage('Failed to reset preferences');
    } finally {
      setIsProcessing(false);
      setShowPrefConfirm(false);
    }
  };

  const triggerClearDemoData = async () => {
    setIsProcessing(true);
    try {
      await settingsService.clearDemoData();
      setActionSuccessMessage('Demo data cleared successfully. Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setActionErrorMessage('Failed to clear demo data');
    } finally {
      setIsProcessing(false);
      setShowClearConfirm(false);
    }
  };

  const triggerResetSampleData = async () => {
    setIsProcessing(true);
    try {
      await settingsService.resetSampleData();
      setActionSuccessMessage('Sample data seeded successfully. Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setActionErrorMessage('Failed to seed sample data');
    } finally {
      setIsProcessing(false);
      setShowResetConfirm(false);
    }
  };

  const handleDatabaseSwitch = (type: 'sqlite' | 'json') => {
    if (type === currentDbType) return;
    const confirmSwitch = window.confirm(
      `Are you sure you want to switch to ${type === 'sqlite' ? 'SQLite' : 'JSON'} database? The page will reload.`
    );
    if (confirmSwitch) {
      settingsService.setDatabaseType(type);
      setCurrentDbType(type);
      window.location.reload();
    }
  };

  const handleSyncDatabases = async () => {
    try {
      await settingsService.syncDatabases();
      alert('Database synced successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync databases');
    }
  };

  // Test Receipts
  const generateTestEnglishPDF = () => {
    const testSale = {
      id: 'TEST-' + Date.now(),
      items: [
        { product: { id: '1', name: 'Test Product 1', price: 150.00 }, quantity: 2, subtotal: 300.00 },
        { product: { id: '2', name: 'Test Product 2', price: 75.50 }, quantity: 1, subtotal: 75.50 }
      ],
      total: 375.50,
      tax: 0,
      discount: 25.50,
      finalAmount: 350.00,
      amountPaid: 400.00,
      change: 50.00,
      dueAmount: 0,
      paymentMethod: 'cash' as const,
      cashierId: 'admin',
      createdAt: new Date()
    };

    generatePDFReceipt({
      sale: testSale,
      customer: { id: 'test', name: 'John Doe', phone: '+92 300 1234567' },
      shopInfo: formState,
    });
  };

  const generateTestUrduReceipt = () => {
    const testSale = {
      id: 'TEST-' + Date.now(),
      items: [
        { product: { id: '1', name: 'ٹیسٹ پروڈکٹ 1', price: 150.00 }, quantity: 2, subtotal: 300.00 },
        { product: { id: '2', name: 'ٹیسٹ پروڈکٹ 2', price: 75.50 }, quantity: 1, subtotal: 75.50 }
      ],
      total: 375.50,
      tax: 0,
      discount: 25.50,
      finalAmount: 350.00,
      amountPaid: 400.00,
      change: 50.00,
      dueAmount: 0,
      paymentMethod: 'cash' as const,
      cashierId: 'admin',
      createdAt: new Date()
    };

    generateUrduPDFReceipt({
      sale: testSale,
      customer: { id: 'test', name: 'جان ڈو', phone: '+92 300 1234567' },
      shopInfo: formState,
    });
  };

  const navigationItems = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'tax', label: 'Tax Settings', icon: Percent },
    { id: 'receipt', label: 'Receipt Settings', icon: Printer },
    { id: 'barcode', label: 'SKU & Barcode Settings', icon: Barcode },
    { id: 'inventory', label: 'Inventory Defaults', icon: Sliders },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'notifications', label: 'Notifications Preferences', icon: Bell },
    { id: 'backup', label: 'Backup & Restore', icon: Database }
  ].filter(item => {
    if (item.id === 'staff') {
      return user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin';
    }
    return true;
  });

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto px-4 md:px-6">
      <PageHeader
        title="Business Configuration Center"
        subtitle="Configure every aspect of your enterprise POS system, localization, defaults, and data backups."
        icon={SettingsIcon}
        breadcrumbs={[
          { label: 'Home', onClick: () => window.location.hash = '#/' },
          { label: 'Settings' }
        ]}
        actions={[
          {
            label: 'Save Configuration',
            onClick: () => handleSave(),
            icon: isProcessing ? RefreshCw : Save,
            variant: 'primary',
            disabled: isProcessing
          }
        ]}
      >
        <div className="flex items-center space-x-3 shrink-0">
          {saveSuccess && (
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50 animate-pulse">
              <Check className="h-4 w-4 mr-1.5" /> Saved
            </span>
          )}
          {saveError && (
            <span className="text-rose-600 dark:text-rose-400 text-sm font-medium bg-rose-50 dark:bg-rose-950/30 px-3.5 py-1.5 rounded-full border border-rose-200/50 dark:border-rose-900/50">
              {saveError}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Main Alert Banner */}
      {(actionSuccessMessage || actionErrorMessage) && (
        <div className="animate-fadeIn">
          {actionSuccessMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-emerald-800 dark:text-emerald-300 font-medium text-sm">{actionSuccessMessage}</p>
            </div>
          )}
          {actionErrorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-rose-800 dark:text-rose-300 font-medium text-sm">{actionErrorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Configuration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-800 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
            Categories
          </p>
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'receipt') {
                    navigate('/dashboard/settings/receipt');
                  } else {
                    setActiveTab(item.id as any);
                  }
                }}
                className={`flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-900/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Setting Panel */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-slate-200/80 dark:border-gray-800 shadow-sm transition-all duration-300">
            {/* 1. Business Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Business Profile
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Manage your primary contact credentials, physical address, and registration codes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Business Name (English)
                    </label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      required
                    />
                  </div>


                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={formState.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourstore.com"
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>


                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Business Description
                    </label>
                    <textarea
                      value={formState.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      placeholder="Brief details about the company..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Physical Address (English)
                    </label>
                    <textarea
                      value={formState.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      required
                    />
                  </div>

                </div>
              </div>
            )}

            {/* 3. Localization */}
            {activeTab === 'localization' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-500" />
                    Localization & Regional Settings
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Manage currency tokens, date notations, timezones, and number formats.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Primary Currency
                    </label>
                    <select
                      value={formState.currency || 'PKR'}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                    >
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="AED">UAE Dirham (AED)</option>
                      <option value="SAR">Saudi Riyal (SAR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={formState.currencySymbol || 'Rs.'}
                      onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      System Language (Future-Ready)
                    </label>
                    <select
                      value={formState.language || 'en'}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="en">English (Default)</option>
                      <option value="ur">اردو (Urdu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Time Zone
                    </label>
                    <select
                      value={formState.timeZone || 'UTC+5'}
                      onChange={(e) => handleInputChange('timeZone', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="UTC+5">PKT (UTC+5)</option>
                      <option value="UTC+0">GMT/UTC (UTC+0)</option>
                      <option value="UTC-5">EST (UTC-5)</option>
                      <option value="UTC+8">SGT (UTC+8)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Date Format
                    </label>
                    <select
                      value={formState.dateFormat || 'dd/MM/yyyy'}
                      onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="dd/MM/yyyy">DD/MM/YYYY (e.g. 02/07/2026)</option>
                      <option value="MM/dd/yyyy">MM/DD/YYYY (e.g. 07/02/2026)</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD (e.g. 2026-07-02)</option>
                      <option value="dd MMM yyyy">DD MMM YYYY (e.g. 02 Jul 2026)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Number Format
                    </label>
                    <select
                      value={formState.numberFormat || '1,234.56'}
                      onChange={(e) => handleInputChange('numberFormat', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="1,234.56">1,234.56 (Comma Decimal)</option>
                      <option value="1.234,56">1.234,56 (Period Decimal)</option>
                      <option value="1234.56">1234.56 (No separators)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Tax Settings */}
            {activeTab === 'tax' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Percent className="h-5 w-5 text-rose-500" />
                    Tax Settings
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Configure multiple tax brackets, default tax rates, inclusive/exclusive behaviors.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Default Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.taxRate}
                      onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Pricing Mode
                    </label>
                    <div className="flex rounded-xl border border-slate-300/80 dark:border-gray-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('taxInclusive', true);
                          handleInputChange('taxExclusive', false);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                          formState.taxInclusive 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300'
                        }`}
                      >
                        Inclusive
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('taxInclusive', false);
                          handleInputChange('taxExclusive', true);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                          formState.taxExclusive 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300'
                        }`}
                      >
                        Exclusive
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Invoice Tax Display
                    </label>
                    <select
                      value={formState.invoiceTaxDisplay || 'detailed'}
                      onChange={(e) => handleInputChange('invoiceTaxDisplay', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="detailed">Detailed Breakdown (per item)</option>
                      <option value="summary">Summary Total only</option>
                    </select>
                  </div>
                </div>

                {/* Multiple Tax Rates Manager */}
                <div className="bg-slate-50 dark:bg-gray-950/40 p-5 rounded-2xl border border-slate-200/50 dark:border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multiple Tax Rates Brackets</h3>
                    <span className="text-xs text-slate-400 dark:text-gray-500">Configured brackets</span>
                  </div>

                  <div className="space-y-3.5">
                    {taxRates.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-800">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs px-2.5 py-1 rounded-md">
                            {item.rate}%
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTaxRate(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Rate Form */}
                  <div className="flex items-end gap-3 pt-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase mb-1">
                        Tax Name
                      </label>
                      <input
                        type="text"
                        value={newTaxRateName}
                        onChange={(e) => setNewTaxRateName(e.target.value)}
                        placeholder="e.g. Sales Tax"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-lg text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase mb-1">
                        Rate (%)
                      </label>
                      <input
                        type="number"
                        value={newTaxRateValue}
                        onChange={(e) => setNewTaxRateValue(parseFloat(e.target.value) || 0)}
                        placeholder="16"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-lg text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTaxRate}
                      className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-lg text-sm hover:bg-slate-800 dark:hover:bg-slate-600 transition flex items-center gap-1.5 h-[38px]"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Receipt Settings */}
            {activeTab === 'receipt' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Printer className="h-5 w-5 text-blue-500" />
                    Receipt Settings & Print Options
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Tailor paper printout designs, brand logos, customer info, and layout boundaries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Receipt Size / Layout
                    </label>
                    <select
                      value={formState.receiptSize || '80mm'}
                      onChange={(e) => handleInputChange('receiptSize', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="80mm">Thermal Receipt (80mm - Default)</option>
                      <option value="58mm">Thermal Receipt (58mm)</option>
                      <option value="A4">A4 Full Sheet (Invoice style)</option>
                      <option value="Letter">Letter Format</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Footer Message Template
                    </label>
                    <input
                      type="text"
                      value={formState.receiptFooter || ''}
                      onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                      placeholder="Thank you for shopping with us!"
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Show Business Logo</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Render logo image on thermal print header.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.showLogoReceipt}
                      onChange={(e) => handleInputChange('showLogoReceipt', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Show Customer Details</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Prints customer contact details if registered.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.showCustomerReceipt}
                      onChange={(e) => handleInputChange('showCustomerReceipt', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Show Detailed Tax Breakdown</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Prints item-wise GST percentages.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.showTaxBreakdownReceipt}
                      onChange={(e) => handleInputChange('showTaxBreakdownReceipt', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Show Receipt Barcode / QR</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Appends searchable barcodes at bottom of receipt.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.showBarcodeReceipt}
                      onChange={(e) => handleInputChange('showBarcodeReceipt', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Print Automatically</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Sends document to default printer on save.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.printAutomatically}
                      onChange={(e) => handleInputChange('printAutomatically', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>
                </div>

                {/* Print Verification Tests */}
                <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl space-y-3.5 border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                    Receipt Engine Diagnostics
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify and preview receipt margins. Standard print templates for both language setups can be generated instantly.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={generateTestEnglishPDF}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Test English PDF Receipt
                    </button>
                    <button
                      type="button"
                      onClick={generateTestUrduReceipt}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Test Urdu PDF Receipt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Barcode Settings */}
            {activeTab === 'barcode' && (
              <SkuBarcodeSettingsPanel 
                formState={formState}
                handleInputChange={handleInputChange}
                triggerExport={triggerExportSettings}
                triggerImport={() => {
                  alert('To import configuration, please use the main Settings Import tool in the Backup & Restore tab.');
                }}
                triggerResetCounter={async (type) => {
                  if (type === 'sku') {
                    await handleInputChange('skuCounter', 100000);
                  } else {
                    await handleInputChange('barcodeCounter', 200000000001);
                  }
                  await handleSave();
                  alert(`${type.toUpperCase()} counter has been reset.`);
                }}
              />
            )}

            {/* 7. Inventory Defaults */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-indigo-500" />
                    Inventory & Catalog Defaults
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Manage stock alerts, default weights/units, automated SKU patterns, and accounting methods.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Low Stock Warning Threshold
                    </label>
                    <input
                      type="number"
                      value={formState.lowStockThreshold || 5}
                      onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Default Measurement Unit
                    </label>
                    <select
                      value={formState.defaultUnit || 'pcs'}
                      onChange={(e) => handleInputChange('defaultUnit', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="ft">Feet (ft)</option>
                      <option value="mtr">Meters (mtr)</option>
                      <option value="box">Boxes (box)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      SKU Auto-Generation Rule Pattern
                    </label>
                    <input
                      type="text"
                      value={formState.skuGenerationPattern || ''}
                      onChange={(e) => handleInputChange('skuGenerationPattern', e.target.value)}
                      placeholder="e.g. BRAND-CAT-RAND"
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Inventory Valuation Method (Future-Ready)
                    </label>
                    <select
                      value={formState.inventoryValuationMethod || 'FIFO'}
                      onChange={(e) => handleInputChange('inventoryValuationMethod', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="FIFO">FIFO (First In First Out - Recommended)</option>
                      <option value="LIFO">LIFO (Last In First Out)</option>
                      <option value="AVCO">Weighted Average Cost (AVCO)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Auto-Assign Product SKU Code</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Generates and binds unique stock numbers upon saving new products.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.autoProductCode}
                      onChange={(e) => handleInputChange('autoProductCode', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 9. Backup & Restore */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-500" />
                    Database Backup & Restore
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Export entire database files or restore previous state. Secure validation runs prior to writing files.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Export Box */}
                  <div className="bg-slate-50 dark:bg-gray-950/30 p-6 rounded-2xl border border-slate-200/80 dark:border-gray-800 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-blue-500" /> Export Database Backup
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                      Download a raw, complete JSON file of all data. Includes inventory stocks, products catalog, customers list, transactions history, expenses, and configuration rules.
                    </p>
                    <button
                      type="button"
                      onClick={triggerExportBackup}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
                    >
                      Export Database (JSON)
                    </button>
                  </div>

                  {/* Import Box */}
                  <div className="bg-slate-50 dark:bg-gray-950/30 p-6 rounded-2xl border border-slate-200/80 dark:border-gray-800 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ArrowDownLeft className="h-5 w-5 text-emerald-500" /> Import Database Backup
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                      Select a valid `.json` file from your device. <strong>Warning:</strong> Restoring this file replaces your current database. Validated schema checks are forced.
                    </p>
                    <label className="block w-full text-center py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition cursor-pointer">
                      <span>Import Database (JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 13. Notifications Preferences */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-gray-700/60 pb-4">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    Notification Center Preferences
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
                    Select which notification modules and events are active. Disabled categories will be filtered out.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Low Stock & Catalog Alerts</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Receive warning notifications when items fall below their minimum levels or go completely out of stock.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.lowStockAlerts}
                      onChange={(e) => handleInputChange('lowStockAlerts', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Sales & Return Alerts</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Receive notifications for large checkout transactions, processed customer refunds, and items exchanges.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.salesAlerts}
                      onChange={(e) => handleInputChange('salesAlerts', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Customer Account Balances</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Receive warning notifications when customer pending amounts exceed outstanding credit ceilings.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.customerBalanceAlerts}
                      onChange={(e) => handleInputChange('customerBalanceAlerts', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Supplier & Purchase Orders</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Receive notifications for outstanding supplier balances and status changes in received purchase orders.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.supplierPaymentAlerts}
                      onChange={(e) => handleInputChange('supplierPaymentAlerts', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">System Actions & Backups</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Get notified about system status actions like imports, database exports, and security warnings.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.systemNotifications}
                      onChange={(e) => handleInputChange('systemNotifications', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-950/40 border border-slate-200/60 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-900/60 transition">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Desktop Push Notifications</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Allow Counter Pro to send system tray desktop toast banners when minimized.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formState.desktopNotifications}
                      onChange={(e) => handleInputChange('desktopNotifications', e.target.checked)}
                      className="h-5.5 w-5.5 text-blue-600 focus:ring-blue-500 rounded-md"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <StaffManagementPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
