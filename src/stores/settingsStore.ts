import { create } from 'zustand';
import settingsService from '../services/settingsService';

export interface ShopSettings {
  id: number;
  name: string;
  nameUrdu: string;
  address: string;
  addressUrdu: string;
  phone: string;
  email: string;
  taxRate: number;
  updatedAt: string;

  // Business Profile
  logo?: string;
  website?: string;
  taxRegistrationNumber?: string;
  description?: string;

  // Branding
  invoiceLogo?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;

  // Localization
  currency?: string;
  currencySymbol?: string;
  language?: string;
  timeZone?: string;
  dateFormat?: string;
  numberFormat?: string;

  // Tax Settings
  taxRatesJson?: string;
  taxInclusive?: boolean;
  taxExclusive?: boolean;
  invoiceTaxDisplay?: string;

  // Receipt Settings
  receiptSize?: string;
  showLogoReceipt?: boolean;
  showCustomerReceipt?: boolean;
  showTaxBreakdownReceipt?: boolean;
  showBarcodeReceipt?: boolean;
  printAutomatically?: boolean;

  // Barcode Settings
  barcodeType?: string;
  barcodePrefix?: string;
  barcodeLength?: number;
  autoBarcodeGen?: boolean;

  // Inventory Defaults
  lowStockThreshold?: number;
  defaultUnit?: string;
  skuGenerationPattern?: string;
  autoProductCode?: boolean;
  inventoryValuationMethod?: string;

  // POS Defaults
  defaultPaymentMethod?: string;
  defaultCustomerType?: string;
  autoPrintReceiptPOS?: boolean;
  openCashDrawer?: boolean;
  defaultDiscountBehavior?: string;

  // Notification Preferences
  lowStockAlerts?: boolean;
  purchaseAlerts?: boolean;
  salesAlerts?: boolean;
  customerBalanceAlerts?: boolean;
  supplierPaymentAlerts?: boolean;
  systemNotifications?: boolean;
  desktopNotifications?: boolean;

  // Appearance
  systemTheme?: boolean;
  compactMode?: boolean;
  comfortableMode?: boolean;
  sidebarBehavior?: string;
  dashboardDensity?: string;

  // Keyboard Shortcuts
  shortcutNewSale?: string;
  shortcutAddProduct?: string;
  shortcutSearch?: string;
  shortcutPrintReceipt?: string;
  shortcutSave?: string;
  shortcutDashboard?: string;
  shortcutReports?: string;

  // Advanced Preferences
  autoSave?: boolean;
  autoRefresh?: boolean;
  defaultLandingPage?: string;
  numberPrecision?: number;
  searchBehavior?: string;
  tableDensity?: string;

  // Security
  sessionTimeout?: number;
  autoLogout?: boolean;
  deviceRemembering?: boolean;
  passwordPolicy?: string;
}

interface SettingsStore {
  settings: ShopSettings;
  shopSettings: ShopSettings;
  initializeFromDatabase: () => Promise<void>;
  updateShopSettings: (settings: ShopSettings) => Promise<void>;
}

export const defaultSettings: ShopSettings = {
  id: 1,
  name: 'Counter Pro',
  nameUrdu: 'کاؤنٹر پرو',
  address: 'Mingora Bypass, Swat',
  addressUrdu: 'مینگورہ بائی پاس، سوات',
  phone: '03000000000',
  email: 'info@counterpro.com',
  taxRate: 0,
  updatedAt: new Date().toISOString(),

  // Business Profile
  logo: '',
  website: 'https://counterpro.com',
  taxRegistrationNumber: 'NTN-1234567-8',
  description: 'Premium Retail and Wholesale POS Solution',

  // Branding
  invoiceLogo: '',
  receiptHeader: 'Welcome to Counter Pro!',
  receiptFooter: 'Thank you for shopping with us!',
  primaryColor: '#2563eb', // blue-600
  secondaryColor: '#4f46e5', // indigo-600
  accentColor: '#06b6d4', // cyan-500

  // Localization
  currency: 'PKR',
  currencySymbol: 'Rs.',
  language: 'en',
  timeZone: 'UTC+5',
  dateFormat: 'dd/MM/yyyy',
  numberFormat: '1,234.56',

  // Tax Settings
  taxRatesJson: JSON.stringify([
    { name: 'GST', rate: 17 },
    { name: 'SST', rate: 13 },
    { name: 'Exempt', rate: 0 }
  ]),
  taxInclusive: false,
  taxExclusive: true,
  invoiceTaxDisplay: 'detailed',

  // Receipt Settings
  receiptSize: '80mm',
  showLogoReceipt: true,
  showCustomerReceipt: true,
  showTaxBreakdownReceipt: true,
  showBarcodeReceipt: true,
  printAutomatically: false,

  // Barcode Settings
  barcodeType: 'CODE128',
  barcodePrefix: 'CP',
  barcodeLength: 8,
  autoBarcodeGen: true,

  // Inventory Defaults
  lowStockThreshold: 5,
  defaultUnit: 'pcs',
  skuGenerationPattern: 'BRAND-CAT-RAND',
  autoProductCode: true,
  inventoryValuationMethod: 'FIFO',

  // POS Defaults
  defaultPaymentMethod: 'cash',
  defaultCustomerType: 'Walk-in',
  autoPrintReceiptPOS: false,
  openCashDrawer: false,
  defaultDiscountBehavior: 'percentage',

  // Notification Preferences
  lowStockAlerts: true,
  purchaseAlerts: true,
  salesAlerts: true,
  customerBalanceAlerts: false,
  supplierPaymentAlerts: true,
  systemNotifications: true,
  desktopNotifications: false,

  // Appearance
  systemTheme: false,
  compactMode: false,
  comfortableMode: true,
  sidebarBehavior: 'expanded',
  dashboardDensity: 'comfortable',

  // Keyboard Shortcuts
  shortcutNewSale: 'Ctrl+N',
  shortcutAddProduct: 'Ctrl+P',
  shortcutSearch: 'Ctrl+F',
  shortcutPrintReceipt: 'Ctrl+Shift+P',
  shortcutSave: 'Ctrl+S',
  shortcutDashboard: 'Ctrl+D',
  shortcutReports: 'Ctrl+R',

  // Advanced Preferences
  autoSave: true,
  autoRefresh: false,
  defaultLandingPage: 'dashboard',
  numberPrecision: 2,
  searchBehavior: 'debounce',
  tableDensity: 'comfortable',

  // Security
  sessionTimeout: 30,
  autoLogout: true,
  deviceRemembering: true,
  passwordPolicy: 'standard'
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  shopSettings: defaultSettings,

  initializeFromDatabase: async () => {
    try {
      const settings = await settingsService.getSettings();
      // Merge with defaultSettings to ensure all fields are populated
      const mergedSettings = { ...defaultSettings, ...settings };
      set({ settings: mergedSettings, shopSettings: mergedSettings });
    } catch (error) {
      console.error('Failed to initialize settings from database:', error);
      set({ settings: defaultSettings, shopSettings: defaultSettings });
    }
  },

  updateShopSettings: async (newSettings) => {
    try {
      await settingsService.updateSettings(newSettings);
      set({ settings: newSettings, shopSettings: newSettings });
    } catch (error) {
      console.error('Failed to update shop settings:', error);
    }
  },
}));