import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Printer, Palette, FileText, LayoutList, 
  ListOrdered, Calculator, BookOpen, Smartphone, 
  ScanBarcode, Globe, Settings as SettingsIcon, Save, RefreshCw, Eye
} from 'lucide-react';
import { useSettingsStore, ShopSettings } from '../stores/settingsStore';
import { useThemeStore } from '../stores/themeStore';
import { ReceiptPreview } from '../components/ReceiptPreview';
import PageHeader from '../components/PageHeader';

type CategoryId = 
  | 'template' 
  | 'branding' 
  | 'header' 
  | 'content' 
  | 'products' 
  | 'totals' 
  | 'footer' 
  | 'printing' 
  | 'digital' 
  | 'barcode' 
  | 'localization' 
  | 'advanced';

interface Category {
  id: CategoryId;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: Category[] = [
  { id: 'template', label: 'Receipt Template', icon: Printer },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'header', label: 'Header Information', icon: FileText },
  { id: 'content', label: 'Receipt Content', icon: LayoutList },
  { id: 'products', label: 'Product Line Settings', icon: ListOrdered },
  { id: 'totals', label: 'Totals & Financial', icon: Calculator },
  { id: 'footer', label: 'Footer & Policies', icon: BookOpen },
  { id: 'printing', label: 'Printing Hardware', icon: Printer },
  { id: 'digital', label: 'Digital Receipt', icon: Smartphone },
  { id: 'barcode', label: 'Barcode & QR', icon: ScanBarcode },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'advanced', label: 'Advanced', icon: SettingsIcon },
];

const ReceiptSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { shopSettings, updateShopSettings } = useSettingsStore();
  const { isDarkMode } = useThemeStore();

  const [activeCategory, setActiveCategory] = useState<CategoryId>('template');
  const [formState, setFormState] = useState<Partial<ShopSettings>>(shopSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Check if formState differs from shopSettings
    const isDifferent = JSON.stringify(formState) !== JSON.stringify(shopSettings);
    setHasUnsavedChanges(isDifferent);
  }, [formState, shopSettings]);

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await updateShopSettings(formState as ShopSettings);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save receipt settings', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to revert all unsaved changes?')) {
      setFormState(shopSettings);
    }
  };

  const renderToggle = (label: string, field: keyof ShopSettings) => {
    const isChecked = !!formState[field];
    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-200 dark:border-gray-800">
        <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">{label}</span>
        <button
          type="button"
          onClick={() => handleChange(field, !isChecked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isChecked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };

  const renderSelect = (label: string, field: keyof ShopSettings, options: { label: string, value: string }[]) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">{label}</label>
        <select
          value={formState[field] as string || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderInput = (label: string, field: keyof ShopSettings, placeholder?: string) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">{label}</label>
        <input
          type="text"
          value={formState[field] as string || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
        />
      </div>
    );
  };

  const renderTextarea = (label: string, field: keyof ShopSettings, placeholder?: string) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">{label}</label>
        <textarea
          value={formState[field] as string || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
        />
      </div>
    );
  };

  const renderVisibilitySelect = (label: string, field: keyof ShopSettings) => {
    return renderSelect(label, field, [
      { label: 'Visible', value: 'visible' },
      { label: 'Hidden', value: 'hidden' },
      { label: 'Bold', value: 'bold' }
    ]);
  };

  const renderCenterPanel = () => {
    switch (activeCategory) {
      case 'template':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Receipt Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderSelect('Paper Size', 'receiptSize', [
                { label: '80mm Thermal', value: '80mm' },
                { label: '58mm Thermal', value: '58mm' },
                { label: 'A4 Invoice', value: 'A4' },
                { label: 'Letter Size', value: 'Letter' }
              ])}
              {renderSelect('Typography Font', 'receiptFont', [
                { label: 'Monospace (Classic)', value: 'mono' },
                { label: 'Sans Serif (Modern)', value: 'sans' }
              ])}
              {renderSelect('Character Density', 'receiptCharacterDensity', [
                { label: 'Normal', value: 'normal' },
                { label: 'Compact', value: 'compact' },
                { label: 'Spacious', value: 'spacious' }
              ])}
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Branding</h3>
            <div className="grid grid-cols-1 gap-5">
              {renderToggle('Show Business Logo', 'showLogoReceipt')}
              {renderInput('Store Name Overlay (Optional)', 'storeName', 'Leave blank to use system default')}
              {renderInput('Branch Name', 'branchName', 'e.g., Downtown Branch')}
              {renderInput('Tagline', 'tagline', 'e.g., Quality you can trust!')}
              {renderInput('Receipt Background Color (Hex)', 'receiptBackground', '#ffffff')}
              {renderToggle('Enable Watermark', 'watermark')}
            </div>
          </div>
        );

      case 'header':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Header Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToggle('Business Name', 'showHeaderBusinessName')}
              {renderToggle('Branch', 'showHeaderBranch')}
              {renderToggle('Address', 'showHeaderAddress')}
              {renderToggle('Phone Number', 'showHeaderPhone')}
              {renderToggle('Email Address', 'showHeaderEmail')}
              {renderToggle('Website', 'showHeaderWebsite')}
              {renderToggle('NTN', 'showHeaderNTN')}
              {renderToggle('STRN', 'showHeaderSTRN')}
              {renderToggle('GST', 'showHeaderGST')}
              {renderToggle('Social Media Links', 'showHeaderSocial')}
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Receipt Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderVisibilitySelect('Invoice Number', 'showInvoiceNumber')}
              {renderVisibilitySelect('Date', 'showDate')}
              {renderVisibilitySelect('Time', 'showTime')}
              {renderVisibilitySelect('Cashier Name', 'showCashier')}
              {renderVisibilitySelect('Customer Name', 'showCustomerName')}
              {renderVisibilitySelect('Customer Phone', 'showCustomerPhone')}
              {renderVisibilitySelect('Customer Address', 'showCustomerAddress')}
              {renderVisibilitySelect('Payment Method', 'showPaymentMethod')}
              {renderVisibilitySelect('Counter / Register Number', 'showCounterNumber')}
              {renderVisibilitySelect('Terminal / POS ID', 'showTerminal')}
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Product Line Settings</h3>
            <div className="mb-6">
               {renderSelect('Line View Mode', 'productViewMode', [
                 { label: 'Compact List (Best for 58/80mm)', value: 'compact' },
                 { label: 'Table Layout (Best for A4/Letter)', value: 'table' }
               ])}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToggle('Product Name', 'showProductName')}
              {renderToggle('SKU', 'showSKU')}
              {renderToggle('Brand', 'showBrand')}
              {renderToggle('Category', 'showCategory')}
              {renderToggle('Quantity', 'showQuantity')}
              {renderToggle('Unit Price', 'showUnitPrice')}
              {renderToggle('Line Discount', 'showProductDiscount')}
              {renderToggle('Line Tax', 'showProductTax')}
              {renderToggle('Variant Details', 'showVariant')}
              {renderToggle('Serial Number', 'showSerialNumber')}
              {renderToggle('Batch Number', 'showBatchNumber')}
              {renderToggle('Expiry Date', 'showExpiryDate')}
            </div>
          </div>
        );

      case 'totals':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Totals & Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToggle('Subtotal', 'showSubtotal')}
              {renderToggle('Total Discount', 'showTotalDiscount')}
              {renderToggle('Coupons Applied', 'showCoupons')}
              {renderToggle('Total Tax', 'showTotalTax')}
              {renderToggle('Service Charges', 'showServiceCharges')}
              {renderToggle('Delivery Charges', 'showDeliveryCharges')}
              {renderToggle('Tips', 'showTips')}
              {renderToggle('Cash Received', 'showCashReceived')}
              {renderToggle('Change Returned', 'showChangeReturned')}
              {renderToggle('Grand Total', 'showGrandTotal')}
              {renderToggle('Loyalty Points Gained', 'showLoyaltyPoints')}
              {renderToggle('Gift Card Balance', 'showGiftCardBalance')}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Footer & Policies</h3>
            <div className="grid grid-cols-1 gap-5">
              {renderInput('Footer Message', 'receiptFooter', 'Thank you for shopping with us!')}
              {renderTextarea('Exchange Policy', 'exchangePolicy', 'Items can be exchanged within 7 days with original receipt.')}
              {renderTextarea('Refund Policy', 'refundPolicy', 'No cash refunds.')}
              {renderTextarea('Terms & Conditions', 'termsAndConditions')}
              {renderInput('Facebook Handle', 'socialFacebook')}
              {renderInput('Instagram Handle', 'socialInstagram')}
              {renderInput('WhatsApp Support Number', 'socialWhatsApp')}
            </div>
          </div>
        );

      case 'printing':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Printing Hardware</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {renderToggle('Auto Print on Checkout', 'printAutomatically')}
              {renderToggle('Print Customer Copy', 'printCustomerCopy')}
              {renderToggle('Print Merchant Copy', 'printMerchantCopy')}
              {renderToggle('Print Kitchen/Dispatch Copy', 'printKitchenCopy')}
              {renderToggle('Auto Cut Paper', 'printAutoCut')}
              {renderToggle('Beep on Print', 'printBeep')}
              {renderToggle('Silent Printing', 'printSilent')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {renderSelect('Connection Type', 'connectionType', [
                 { label: 'USB / Local', value: 'usb' },
                 { label: 'Bluetooth', value: 'bluetooth' },
                 { label: 'LAN / Network', value: 'lan' },
                 { label: 'Cloud Print', value: 'cloud' }
               ])}
               {renderSelect('Printer Encoding', 'printerEncoding', [
                 { label: 'UTF-8', value: 'utf8' },
                 { label: 'ESC/POS', value: 'escpos' },
                 { label: 'Star', value: 'star' },
                 { label: 'Epson', value: 'epson' }
               ])}
               {renderInput('Default Printer Target', 'defaultPrinter', 'e.g., 192.168.1.100')}
            </div>
          </div>
        );

      case 'digital':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Digital Receipt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToggle('Email Receipt Capability', 'digitalReceiptEmail')}
              {renderToggle('SMS Receipt Capability', 'digitalReceiptSMS')}
              {renderToggle('WhatsApp Integration', 'digitalReceiptWhatsApp')}
              {renderToggle('Generate PDF Automatically', 'digitalReceiptPDF')}
              {renderToggle('Upload to Customer Portal', 'digitalReceiptCustomerPortal')}
              {renderToggle('Attach PDF to Emails', 'attachPdfAutomatically')}
            </div>
          </div>
        );

      case 'barcode':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Barcode & QR</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {renderSelect('Barcode Size', 'barcodeSize', [
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' }
              ])}
              {renderSelect('QR Type', 'qrType', [
                { label: 'Invoice Link', value: 'invoice' },
                { label: 'Website Link', value: 'website' },
                { label: 'Payment Gateway', value: 'payment' },
                { label: 'Feedback Form', value: 'feedback' },
                { label: 'Loyalty Scan', value: 'loyalty' }
              ])}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToggle('Show Barcode on Receipt', 'showBarcodeReceipt')}
              {renderToggle('Show Header QR Code', 'showHeaderQR')}
              {renderInput('Custom Website QR URL', 'qrWebsiteUrl', 'https://counterpro.com')}
            </div>
          </div>
        );

      case 'localization':
      case 'advanced':
        return (
          <div className="space-y-6 animate-fadeIn flex flex-col items-center justify-center h-48 text-slate-500">
            <SettingsIcon className="h-10 w-10 mb-3 opacity-20" />
            <p>Settings relocated to Global Settings module.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 shadow-sm px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/dashboard/settings')}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Receipt Customizer</h1>
            <p className="text-[11px] text-slate-500 font-medium">Design & Configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse">Unsaved Changes</span>
          )}
        </div>
      </header>

      {/* Main 3-Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* PANEL 1: Left Sidebar Categories */}
        <aside className="w-72 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 overflow-y-auto shrink-0 py-6">
          <div className="px-6 mb-4">
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Configuration Sets</p>
          </div>
          <nav className="space-y-1 px-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800/60 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* PANEL 2: Center Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-gray-950 p-8 relative">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            {renderCenterPanel()}
          </div>
        </div>

        {/* PANEL 3: Sticky Right Live Preview */}
        <aside className="w-[450px] bg-slate-100 dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 flex flex-col shrink-0 relative z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 bg-white/80 backdrop-blur-sm z-20 flex justify-between items-center shrink-0">
             <div className="flex items-center space-x-2">
               <Eye className="h-4 w-4 text-slate-400" />
               <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Preview</span>
             </div>
             <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600">{formState.receiptSize || '80mm'}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start pattern-grid-lg text-slate-900/5">
             <ReceiptPreview settings={formState} />
          </div>
        </aside>

      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-md dark:bg-gray-900/90 border-t border-slate-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReset}
            disabled={!hasUnsavedChanges}
            className={`text-sm font-semibold transition-colors ${hasUnsavedChanges ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 cursor-not-allowed'}`}
          >
            Reset Defaults
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm">
            Print Test Receipt
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isProcessing}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all shadow-md ${
              hasUnsavedChanges 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-blue-500/40' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ReceiptSettings;
