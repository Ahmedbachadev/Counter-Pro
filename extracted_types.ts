export interface Category {
  id: number | string;
  name: string;
  nameUrdu: string;
  description?: string;
  createdAt: string;
}
export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  cost: number;
  price: number;
  stock: number;
}
export interface Product {
  id: number | string;
  name: string;
  nameUrdu?: string;
  categoryId: number | string;
  supplierId?: number | string;
  barcode?: string;
  sku?: string;
  brand?: string;
  price: number;
  cost: number;
  stock: number;
  initialStock: number;
  minStock: number;
  description?: string;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
  status?: 'Active' | 'Draft' | 'Discontinued';
  createdAt: string;
  updatedAt: string;
}
export interface Customer {
  id: number | string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  pendingAmount: number;
  loyaltyPoints?: number;
  customerType?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
  status?: string;
  createdAt: Date;
}
export interface CustomerPayment {
  id: number | string;
  customerId: number | string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}
export interface CustomerLoyaltyHistory {
  id: number | string;
  customerId: number | string;
  points: number;
  transactionType: 'earn' | 'redeem' | 'adjust';
  referenceType?: 'sale' | 'refund' | 'manual';
  referenceId?: string;
  notes?: string;
  createdAt: string;
}
export type PaymentMethod = 'cash' | 'card' | 'credit' | 'bank_transfer' | 'mobile_wallet' | 'other';

export interface SplitPaymentItem {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}
export interface Sale {
  id: number | string;
  total: number;
  tax: number;
  discount: number;
  finalAmount: number;
  amountPaid: number | string;
  change: number;
  dueAmount: number;
  paymentMethod: PaymentMethod; // primary method or 'split' representation for legacy fields
  payments?: SplitPaymentItem[]; // multi-mode payment details
  paymentStatus?: 'Fully Paid' | 'Partially Paid' | 'Credit Sale';
  customerId?: number | string;
  cashierId: string;
  createdAt: Date;
}
export interface User {
  id: number | string;
  username: string;
  password?: string;
  role: 'Owner' | 'Manager' | 'Cashier' | 'Inventory Manager' | 'Accountant' | 'admin';
  name?: string;
  email?: string;
  phone?: string;
  status: 'Active' | 'Disabled';
  lastActive?: string;
  profilePhoto?: string;
  jobTitle?: string;
  preferredLanguage?: string;
  timeZone?: string;
  bio?: string;
  createdAt: string;
}
export interface SaleItem {
  id: number | string;
  saleId: number | string;
  productId: number | string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}
export interface ShopSettings {
  id: number | string;
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
export interface Supplier {
  id: number | string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  logo?: string;
  category?: string;
  status: 'Active' | 'Inactive';
  outstandingBalance: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  paymentTerms?: string;
  specialties?: string;
  discountRate?: number;
  documents?: string; // JSON string
  activityLog?: string; // JSON string
  createdAt: string;
  updatedAt: string;
}
export interface StockPurchase {
  id: number | string;
  productId: number | string;
  productName: string;
  supplierId: number | string;
  supplierName: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  createdAt: string;
}
export interface Expense {
  id: number | string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  vendor?: string;
  status?: string;
  addedBy?: string;
  lastUpdated?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRecurringDate?: string;
  createdAt: string;
}
export interface StockAdjustment {
  id: number | string;
  productId: number | string;
  productName: string;
  quantity: number;
  adjustmentType: 'Stock In' | 'Stock Out' | 'Damaged' | 'Lost' | 'Returned' | 'Manual Correction';
  reason: string;
  notes?: string;
  user?: string;
  createdAt: string;
}
export interface PurchaseEntry {
  id: number | string;
  supplierId: number | string;
  supplierName: string;
  purchaseDate: string;
  invoiceNumber?: string;
  taxes: number;
  discounts: number;
  notes?: string;
  totalAmount: number;
  user?: string;
  createdAt: string;
  items?: PurchaseEntryItem[];
}
export interface PurchaseEntryItem {
  id: number | string;
  purchaseEntryId: number | string;
  productId: number | string;
  productName: string;
  costPrice: number;
  quantity: number;
  subtotal: number;
}
export interface StockMovement {
  id: number | string;
  productId: number | string;
  productName: string;
  actionType: string;
  qtyBefore: number;
  qtyChanged: number;
  qtyAfter: number;
  reference?: string;
  notes?: string;
  user?: string;
  createdAt: string;
}
export interface InventoryAuditLog {
  id: number | string;
  action: string;
  reference?: string;
  description: string;
  user?: string;
  createdAt: string;
}
