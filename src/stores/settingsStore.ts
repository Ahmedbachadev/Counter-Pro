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
  taxRegistrationNumber?: string; // e.g. NTN
  registrationNumber?: string; // e.g. SECP/Company Registration
  description?: string;
  ownerName?: string;
  whatsappNumber?: string;
  city?: string;
  country?: string;
  preferences?: string; // Fallback JSON column


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

  // --- NEW RECEIPT CUSTOMIZER FIELDS ---
  watermark?: boolean;
  storeName?: string;
  branchName?: string;
  tagline?: string;
  receiptBackground?: string;
  showHeaderBusinessName?: boolean;
  showHeaderBranch?: boolean;
  showHeaderAddress?: boolean;
  showHeaderPhone?: boolean;
  showHeaderEmail?: boolean;
  showHeaderWebsite?: boolean;
  showHeaderNTN?: boolean;
  showHeaderSTRN?: boolean;
  showHeaderGST?: boolean;
  showHeaderQR?: boolean;
  showHeaderSocial?: boolean;
  showInvoiceNumber?: string;
  showDate?: string;
  showTime?: string;
  showCashier?: string;
  showCustomerName?: string;
  showCustomerPhone?: string;
  showCustomerAddress?: string;
  showMembership?: string;
  showPaymentMethod?: string;
  showCounterNumber?: string;
  showTerminal?: string;
  showOrderNotes?: string;
  showProductName?: boolean;
  showSKU?: boolean;
  showBrand?: boolean;
  showCategory?: boolean;
  showQuantity?: boolean;
  showUnitPrice?: boolean;
  showProductDiscount?: boolean;
  showProductTax?: boolean;
  showSerialNumber?: boolean;
  showBatchNumber?: boolean;
  showExpiryDate?: boolean;
  showVariant?: boolean;
  productViewMode?: string;
  showSubtotal?: boolean;
  showTotalDiscount?: boolean;
  showCoupons?: boolean;
  showTotalTax?: boolean;
  showServiceCharges?: boolean;
  showDeliveryCharges?: boolean;
  showTips?: boolean;
  showCashReceived?: boolean;
  showChangeReturned?: boolean;
  showGrandTotal?: boolean;
  showLoyaltyPoints?: boolean;
  showGiftCardBalance?: boolean;
  exchangePolicy?: string;
  refundPolicy?: string;
  warrantyPolicy?: string;
  termsAndConditions?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialWhatsApp?: string;
  printCopies?: number;
  printCustomerCopy?: boolean;
  printMerchantCopy?: boolean;
  printKitchenCopy?: boolean;
  printSilent?: boolean;
  printAutoCut?: boolean;
  printBeep?: boolean;
  defaultPrinter?: string;
  connectionType?: string;
  printerEncoding?: string;
  digitalReceiptEmail?: boolean;
  digitalReceiptSMS?: boolean;
  digitalReceiptWhatsApp?: boolean;
  digitalReceiptPDF?: boolean;
  digitalReceiptCustomerPortal?: boolean;
  attachPdfAutomatically?: boolean;
  qrType?: string;
  qrWebsiteUrl?: string;
  barcodeSize?: string;
  receiptFont?: string;
  receiptCharacterDensity?: string;
  // -------------------------------------

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
  registrationNumber: '',
  description: 'Premium Retail and Wholesale POS Solution',
  ownerName: '',
  whatsappNumber: '',
  city: 'Swat',
  country: 'Pakistan',
  preferences: '{}',


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

  // --- NEW RECEIPT CUSTOMIZER DEFAULTS ---
  watermark: false,
  storeName: '',
  branchName: '',
  tagline: '',
  receiptBackground: '#ffffff',
  showHeaderBusinessName: true,
  showHeaderBranch: false,
  showHeaderAddress: true,
  showHeaderPhone: true,
  showHeaderEmail: false,
  showHeaderWebsite: false,
  showHeaderNTN: false,
  showHeaderSTRN: false,
  showHeaderGST: false,
  showHeaderQR: false,
  showHeaderSocial: false,
  showInvoiceNumber: 'visible',
  showDate: 'visible',
  showTime: 'visible',
  showCashier: 'visible',
  showCustomerName: 'visible',
  showCustomerPhone: 'hidden',
  showCustomerAddress: 'hidden',
  showMembership: 'hidden',
  showPaymentMethod: 'visible',
  showCounterNumber: 'hidden',
  showTerminal: 'hidden',
  showOrderNotes: 'hidden',
  showProductName: true,
  showSKU: false,
  showBrand: false,
  showCategory: false,
  showQuantity: true,
  showUnitPrice: true,
  showProductDiscount: true,
  showProductTax: false,
  showSerialNumber: false,
  showBatchNumber: false,
  showExpiryDate: false,
  showVariant: true,
  productViewMode: 'compact',
  showSubtotal: true,
  showTotalDiscount: true,
  showCoupons: false,
  showTotalTax: true,
  showServiceCharges: false,
  showDeliveryCharges: false,
  showTips: false,
  showCashReceived: true,
  showChangeReturned: true,
  showGrandTotal: true,
  showLoyaltyPoints: false,
  showGiftCardBalance: false,
  exchangePolicy: '',
  refundPolicy: '',
  warrantyPolicy: '',
  termsAndConditions: '',
  socialFacebook: '',
  socialInstagram: '',
  socialWhatsApp: '',
  printCopies: 1,
  printCustomerCopy: true,
  printMerchantCopy: false,
  printKitchenCopy: false,
  printSilent: false,
  printAutoCut: true,
  printBeep: true,
  defaultPrinter: '',
  connectionType: 'usb',
  printerEncoding: 'utf8',
  digitalReceiptEmail: false,
  digitalReceiptSMS: false,
  digitalReceiptWhatsApp: false,
  digitalReceiptPDF: true,
  digitalReceiptCustomerPortal: false,
  attachPdfAutomatically: false,
  qrType: 'invoice',
  qrWebsiteUrl: '',
  barcodeSize: 'medium',
  receiptFont: 'mono',
  receiptCharacterDensity: 'normal',
  // ---------------------------------------

  // SKU & Barcode Settings (Enterprise Module)
  autoSkuGeneration: true,
  skuFormat: 'PREFIX-NUMBER',
  skuWorkspacePrefix: 'CP',
  skuStorePrefix: '',
  skuCategoryPrefix: '',
  skuBrandPrefix: '',
  skuPrefixSeparator: '-',
  skuStartingNumber: 100000,
  skuNumberLength: 6,
  skuIncrementBy: 1,

  autoBarcodeGeneration: true,
  barcodeType: 'CODE128',
  barcodePrefix: '200',
  barcodeStartingNumber: 200000000001,
  barcodeLength: 12,
  barcodeIncrementBy: 1,

  skuCounter: 100000,
  barcodeCounter: 200000000001,

  preventDuplicateSku: true,
  preventDuplicateBarcode: true,
  validateDuringImport: true,
  autoDetectConflicts: true,
  autoSuggestNextAvailableNumber: true,
  highlightDuplicateIds: true,

  allowManualSku: true,
  allowManualBarcode: true,

  defaultLabelSize: '30x20 mm',
  labelOrientation: 'Landscape',
  includeProductNameLabel: true,
  includePriceLabel: true,
  includeSkuLabel: true,
  includeBarcodeLabel: true,
  includeBrandLabel: false,
  includeCategoryLabel: false,
  includeLogoLabel: false,
  printQuantityDefault: 1,
  defaultBarcodeFontSize: 'Small',

  scannerOptimization: 'USB Scanner',

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