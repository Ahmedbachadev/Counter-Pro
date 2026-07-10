import React, { useState, useEffect } from 'react';
import { 
  Barcode, Settings2, Package, Hash, AlertCircle, RefreshCw, 
  Download, Upload, FileText, CheckCircle2, XCircle, Printer,
  Smartphone, Monitor, Zap, Shield, Sparkles, SlidersHorizontal,
  Box, Tag, KeyRound, Save, QrCode, AlertTriangle, Fingerprint
} from 'lucide-react';
import { ShopSettings } from '../backend/types';

interface SkuBarcodeSettingsPanelProps {
  formState: ShopSettings;
  handleInputChange: (field: keyof ShopSettings, value: any) => void;
  triggerResetCounter?: (type: 'sku' | 'barcode') => void;
  triggerExport?: () => void;
  triggerImport?: () => void;
}

export const SkuBarcodeSettingsPanel: React.FC<SkuBarcodeSettingsPanelProps> = ({ 
  formState, 
  handleInputChange,
  triggerResetCounter,
  triggerExport,
  triggerImport
}) => {
  // Live Preview State
  const [previewSku, setPreviewSku] = useState('');
  const [previewBarcode, setPreviewBarcode] = useState('');

  // Update Previews
  useEffect(() => {
    let sku = '';
    const numStr = (formState.skuCounter || 100000).toString().padStart(formState.skuNumberLength || 6, '0');
    
    if (formState.skuFormat === 'PREFIX-NUMBER') {
      sku = `${formState.skuWorkspacePrefix}${formState.skuPrefixSeparator}${numStr}`;
    } else if (formState.skuFormat === 'PREFIXNUMBER') {
      sku = `${formState.skuWorkspacePrefix}${numStr}`;
    } else if (formState.skuFormat === 'NUMBER') {
      sku = `${numStr}`;
    } else if (formState.skuFormat === 'CATEGORY-NUMBER') {
      sku = `CAT${formState.skuPrefixSeparator}${numStr}`;
    } else if (formState.skuFormat === 'CATEGORY-BRAND-NUMBER') {
      sku = `CAT${formState.skuPrefixSeparator}BRND${formState.skuPrefixSeparator}${numStr}`;
    } else {
      sku = `${formState.skuWorkspacePrefix || 'CP'}-${numStr}`;
    }
    
    setPreviewSku(sku);
    
    let bc = `${formState.barcodePrefix || ''}${formState.barcodeCounter || 200000000001}`;
    setPreviewBarcode(bc);
  }, [
    formState.skuFormat, 
    formState.skuWorkspacePrefix, 
    formState.skuPrefixSeparator, 
    formState.skuCounter, 
    formState.skuNumberLength,
    formState.barcodePrefix,
    formState.barcodeCounter
  ]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start relative">
      
      {/* Main Settings Area */}
      <div className="xl:col-span-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-gray-700/60 pb-6">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-3">
            <Fingerprint className="h-7 w-7 text-indigo-500" />
            SKU & Barcode Settings
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-2 max-w-2xl">
            Configure how product SKUs and Barcodes are generated across your workspace. Customize prefixes, numbering sequences, barcode formats, uniqueness rules, and printing options.
          </p>
        </div>

        {/* Section 1: Automatic SKU Generation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-500" />
              Automatic SKU Generation
            </h3>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formState.autoSkuGeneration}
                  onChange={(e) => handleInputChange('autoSkuGeneration', e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${formState.autoSkuGeneration ? 'bg-blue-500' : 'bg-slate-300 dark:bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formState.autoSkuGeneration ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          <div className={`p-6 space-y-6 ${!formState.autoSkuGeneration && 'opacity-50 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  SKU Format
                </label>
                <select
                  value={formState.skuFormat || 'PREFIX-NUMBER'}
                  onChange={(e) => handleInputChange('skuFormat', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="PREFIX-NUMBER">PREFIX-000001 (e.g. CP-000001)</option>
                  <option value="PREFIXNUMBER">PREFIX000001 (e.g. CP000001)</option>
                  <option value="NUMBER">000001 (Number Only)</option>
                  <option value="CATEGORY-NUMBER">CATEGORY-000001 (e.g. ELC-000001)</option>
                  <option value="CATEGORY-BRAND-NUMBER">CATEGORY-BRAND-000001</option>
                  <option value="CUSTOM">CUSTOM FORMAT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Workspace Prefix
                </label>
                <input
                  type="text"
                  value={formState.skuWorkspacePrefix || ''}
                  onChange={(e) => handleInputChange('skuWorkspacePrefix', e.target.value)}
                  placeholder="e.g. CP"
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Store Prefix (Optional)
                </label>
                <input
                  type="text"
                  value={formState.skuStorePrefix || ''}
                  onChange={(e) => handleInputChange('skuStorePrefix', e.target.value)}
                  placeholder="e.g. BR01"
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Separator
                </label>
                <select
                  value={formState.skuPrefixSeparator || '-'}
                  onChange={(e) => handleInputChange('skuPrefixSeparator', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value="_">Underscore (_)</option>
                  <option value="">None</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Starting Number
                </label>
                <input
                  type="number"
                  value={formState.skuStartingNumber || 100000}
                  onChange={(e) => handleInputChange('skuStartingNumber', parseInt(e.target.value) || 100000)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Number Length (Padding)
                </label>
                <select
                  value={formState.skuNumberLength || 6}
                  onChange={(e) => handleInputChange('skuNumberLength', parseInt(e.target.value) || 6)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value={4}>4 (0001)</option>
                  <option value={5}>5 (00001)</option>
                  <option value={6}>6 (000001)</option>
                  <option value={7}>7 (0000001)</option>
                  <option value={8}>8 (00000001)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Automatic Barcode Generation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Barcode className="h-5 w-5 text-emerald-500" />
              Automatic Barcode Generation
            </h3>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formState.autoBarcodeGeneration}
                  onChange={(e) => handleInputChange('autoBarcodeGeneration', e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${formState.autoBarcodeGeneration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formState.autoBarcodeGeneration ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>

          <div className={`p-6 space-y-6 ${!formState.autoBarcodeGeneration && 'opacity-50 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Barcode Type
                </label>
                <select
                  value={formState.barcodeType || 'CODE128'}
                  onChange={(e) => handleInputChange('barcodeType', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="CODE128">Code128</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="EAN8">EAN-8</option>
                  <option value="UPCA">UPC-A</option>
                  <option value="UPCE">UPC-E</option>
                  <option value="CODE39">Code39</option>
                  <option value="QR">QR Code</option>
                  <option value="DATAMATRIX">DataMatrix</option>
                  <option value="PDF417">PDF417</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Barcode Prefix
                </label>
                <input
                  type="text"
                  value={formState.barcodePrefix || ''}
                  onChange={(e) => handleInputChange('barcodePrefix', e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Starting Barcode Number
                </label>
                <input
                  type="number"
                  value={formState.barcodeStartingNumber || 200000000001}
                  onChange={(e) => handleInputChange('barcodeStartingNumber', parseInt(e.target.value) || 200000000001)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Increment By
                </label>
                <input
                  type="number"
                  value={formState.barcodeIncrementBy || 1}
                  onChange={(e) => handleInputChange('barcodeIncrementBy', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 & 5: Uniqueness Rules & Manual Override */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <Shield className="h-5 w-5 text-rose-500" />
              Uniqueness Rules
            </h3>
            <div className="space-y-4">
              {[
                { key: 'preventDuplicateSku', label: 'Prevent Duplicate SKU' },
                { key: 'preventDuplicateBarcode', label: 'Prevent Duplicate Barcode' },
                { key: 'validateDuringImport', label: 'Validate During Import' },
                { key: 'autoDetectConflicts', label: 'Auto Detect Conflicts' },
                { key: 'autoSuggestNextAvailableNumber', label: 'Auto Suggest Next Available Number' },
                { key: 'highlightDuplicateIds', label: 'Highlight Duplicate IDs' },
              ].map((rule) => (
                <label key={rule.key} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{rule.label}</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formState[rule.key as keyof ShopSettings] as boolean}
                      onChange={(e) => handleInputChange(rule.key as keyof ShopSettings, e.target.checked)}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${(formState[rule.key as keyof ShopSettings] as boolean) ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                    <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${(formState[rule.key as keyof ShopSettings] as boolean) ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Manual Override
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
              Allow staff to manually enter custom SKUs or Barcodes. Uniqueness is validated instantly.
            </p>
            <div className="space-y-4">
              <label className="flex items-center justify-between group cursor-pointer p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-800">
                <span className="text-sm font-bold text-slate-800 dark:text-gray-200">Allow Manual SKU Override</span>
                <input 
                  type="checkbox" 
                  checked={formState.allowManualSku}
                  onChange={(e) => handleInputChange('allowManualSku', e.target.checked)}
                  className="w-4.5 h-4.5 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>
              <label className="flex items-center justify-between group cursor-pointer p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-800">
                <span className="text-sm font-bold text-slate-800 dark:text-gray-200">Allow Manual Barcode Override</span>
                <input 
                  type="checkbox" 
                  checked={formState.allowManualBarcode}
                  onChange={(e) => handleInputChange('allowManualBarcode', e.target.checked)}
                  className="w-4.5 h-4.5 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>
            </div>
            
            <div className="mt-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">When overridden, live validation will show a green check if available or a red warning if duplicate.</p>
            </div>
          </div>
        </div>

        {/* Section 6: Barcode Printing */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <Printer className="h-5 w-5 text-purple-500" />
            Barcode Printing Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                Default Label Size
              </label>
              <select
                value={formState.defaultLabelSize || '30x20 mm'}
                onChange={(e) => handleInputChange('defaultLabelSize', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              >
                <option value="30x20 mm">30x20 mm</option>
                <option value="40x30 mm">40x30 mm</option>
                <option value="50x25 mm">50x25 mm</option>
                <option value="100x50 mm">100x50 mm</option>
                <option value="Custom">Custom Size</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                Label Orientation
              </label>
              <select
                value={formState.labelOrientation || 'Landscape'}
                onChange={(e) => handleInputChange('labelOrientation', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              >
                <option value="Portrait">Portrait</option>
                <option value="Landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                Default Font Size
              </label>
              <select
                value={formState.defaultBarcodeFontSize || 'Small'}
                onChange={(e) => handleInputChange('defaultBarcodeFontSize', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-gray-700/60">
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider mb-4">
              Include on Label
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'includeProductNameLabel', label: 'Product Name' },
                { key: 'includePriceLabel', label: 'Price' },
                { key: 'includeSkuLabel', label: 'SKU' },
                { key: 'includeBarcodeLabel', label: 'Barcode Graphic' },
                { key: 'includeBrandLabel', label: 'Brand' },
                { key: 'includeCategoryLabel', label: 'Category' },
                { key: 'includeLogoLabel', label: 'Logo' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleInputChange(item.key as keyof ShopSettings, !formState[item.key as keyof ShopSettings])}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    formState[item.key as keyof ShopSettings] 
                      ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-300' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 7: Scanner Compatibility */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Scanner Compatibility
            </h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
              <QrCode className="w-4 h-4" /> Generate Test Barcode
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'USB Scanner', icon: Monitor },
              { id: 'Bluetooth Scanner', icon: Smartphone },
              { id: 'Wireless Scanner', icon: Zap },
              { id: 'Mobile Camera', icon: QrCode },
            ].map((scanner) => (
              <div 
                key={scanner.id}
                onClick={() => handleInputChange('scannerOptimization', scanner.id)}
                className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                  formState.scannerOptimization === scanner.id
                    ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50 ring-2 ring-yellow-400/50'
                    : 'bg-white border-slate-200 hover:border-yellow-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-yellow-700'
                }`}
              >
                <scanner.icon className={`w-6 h-6 mx-auto mb-2 ${formState.scannerOptimization === scanner.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold ${formState.scannerOptimization === scanner.id ? 'text-yellow-800 dark:text-yellow-300' : 'text-slate-600 dark:text-gray-400'}`}>
                  {scanner.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8 & 9: Import/Export & Advanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-cyan-500" />
              Import & Export Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-5">
              During bulk imports, Counter Pro can automatically generate missing SKUs and Barcodes for incoming records.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={triggerExport}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Config
              </button>
              <button 
                onClick={triggerImport}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Import Config
              </button>
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm overflow-hidden p-6">
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" />
              Advanced / Danger Zone
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mb-5">
              Resetting counters will cause the system to start generating identifiers from the beginning, potentially causing conflicts.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (window.confirm("WARNING: Are you sure you want to reset the SKU Counter? This may lead to duplicate identifiers. ONLY perform this if you know what you are doing.")) {
                    if (triggerResetCounter) triggerResetCounter('sku');
                  }
                }}
                className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-sm transition"
              >
                Reset SKU Counter
              </button>
              <button 
                onClick={() => {
                  if (window.confirm("WARNING: Are you sure you want to reset the Barcode Counter?")) {
                    if (triggerResetCounter) triggerResetCounter('barcode');
                  }
                }}
                className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-sm transition"
              >
                Reset Barcode Counter
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar: Sticky Live Preview */}
      <div className="xl:col-span-4 relative">
        <div className="sticky top-6 space-y-6">
          
          <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Live Generation Preview
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* SKU Preview */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Generated SKU</p>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 font-mono text-lg text-white font-medium text-center tracking-wider shadow-inner">
                  {previewSku}
                </div>
              </div>

              {/* Barcode Preview */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Generated Barcode</p>
                <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border-4 border-slate-700 relative overflow-hidden group">
                  <div className="w-full h-16 bg-gradient-to-b from-transparent to-black/5 flex space-x-1 justify-center opacity-80 mix-blend-multiply">
                    {/* Fake barcode bars just for visual rep */}
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-2 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-0.5 bg-black h-full"></div>
                    <div className="w-3 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-2 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-0.5 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-3 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-2 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                    <div className="w-0.5 bg-black h-full"></div>
                    <div className="w-2 bg-black h-full"></div>
                    <div className="w-1 bg-black h-full"></div>
                  </div>
                  <p className="font-mono text-black font-bold text-sm tracking-[0.3em] mt-2">
                    {previewBarcode}
                  </p>
                </div>
              </div>

              {/* Label Layout Preview */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Label Preview ({formState.defaultLabelSize})</p>
                <div className="bg-slate-200 p-4 rounded-xl flex items-center justify-center">
                  <div className={`bg-white shadow-sm border border-slate-300 p-3 flex flex-col items-center justify-between ${formState.labelOrientation === 'Landscape' ? 'w-48 h-32' : 'w-32 h-48'}`}>
                    <div className="w-full text-center space-y-1">
                      {formState.includeLogoLabel && <div className="w-6 h-6 bg-slate-200 rounded mx-auto mb-1"></div>}
                      {formState.includeProductNameLabel && <p className="text-[10px] font-bold text-black leading-tight">Sample Product</p>}
                      {formState.includePriceLabel && <p className="text-[10px] font-bold text-black">Rs. 1,499</p>}
                    </div>
                    {formState.includeBarcodeLabel && (
                      <div className="w-full h-8 bg-slate-800/20 my-1 flex justify-center items-center">
                        <span className="text-[8px] text-slate-400">||||||||||||</span>
                      </div>
                    )}
                    <div className="w-full flex justify-between px-1">
                      {formState.includeSkuLabel && <p className="text-[7px] text-slate-600">{previewSku}</p>}
                      {formState.includeBrandLabel && <p className="text-[7px] text-slate-600">Brand</p>}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-2">
              <Box className="w-4 h-4" /> Workspace Numbering
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed mb-3">
              This workspace uses an isolated counting sequence. The next product will automatically receive:
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-600 dark:text-indigo-500 font-medium">SKU Count:</span>
                <span className="font-bold text-indigo-900 dark:text-indigo-300 bg-white dark:bg-indigo-950 px-2 py-0.5 rounded shadow-sm">{formState.skuCounter}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-600 dark:text-indigo-500 font-medium">Barcode Count:</span>
                <span className="font-bold text-indigo-900 dark:text-indigo-300 bg-white dark:bg-indigo-950 px-2 py-0.5 rounded shadow-sm">{formState.barcodeCounter}</span>
              </div>
            </div>
            <p className="text-[10px] text-indigo-500/80 dark:text-indigo-500 mt-4 italic">
              Deleting products will never reset this numbering, ensuring no duplicate historical identifiers.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
