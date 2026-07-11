import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShopSettings } from '../stores/settingsStore';

interface ReceiptPreviewProps {
  settings: Partial<ShopSettings>;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ settings }) => {
  // Determine width based on paper size
  const getPaperWidth = () => {
    switch (settings.receiptSize) {
      case '58mm': return 'w-[220px]';
      case 'A4':
      case 'Letter': return 'w-[450px]';
      case '80mm':
      default: return 'w-[300px]';
    }
  };

  const getTextSize = () => {
    switch (settings.receiptSize) {
      case '58mm': return 'text-[9px] leading-tight';
      case 'A4':
      case 'Letter': return 'text-sm leading-relaxed';
      case '80mm':
      default: return 'text-xs leading-normal';
    }
  };

  const isWide = settings.receiptSize === 'A4' || settings.receiptSize === 'Letter';
  const fontClass = settings.receiptFont === 'sans' ? 'font-sans' : 'font-mono';

  // Sample data
  const sampleItems = [
    { name: 'Wireless Mouse', sku: 'SKU101', brand: 'Logitech', category: 'Electronics', qty: 2, price: 45.00, discount: 5.00, tax: 2.00, variant: 'Black', total: 80.00 },
    { name: 'Mechanical Keyboard', sku: 'SKU202', brand: 'Keychron', category: 'Electronics', qty: 1, price: 120.00, discount: 0, tax: 6.00, variant: 'Brown Switch', total: 120.00 }
  ];

  return (
    <div className={`mx-auto bg-white shadow-xl shadow-slate-300/40 rounded-sm overflow-hidden relative ${getPaperWidth()} ${getTextSize()} ${fontClass} transition-all duration-300`} style={{ backgroundColor: settings.receiptBackground || '#ffffff', color: '#000000' }}>
      
      {/* Jagged Edge Top */}
      <div className="h-2 w-full bg-[radial-gradient(circle_at_4px_0px,transparent_4px,white_4px)] bg-[length:8px_8px] rotate-180" style={{ backgroundSize: '8px 8px', backgroundImage: `radial-gradient(circle at 4px 0px, transparent 4px, ${settings.receiptBackground || '#ffffff'} 4px)` }}></div>
      
      <div className="p-4 md:p-6 flex flex-col relative z-10 space-y-4">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-1">
          {settings.showLogoReceipt && (
             <img src={settings.logo || '/assets/primarylogo.png'} alt="Logo" className="h-12 w-auto mx-auto mb-2 grayscale contrast-125" />
          )}
          {settings.showHeaderBusinessName && (
             <h2 className="font-bold text-lg leading-tight uppercase">{settings.storeName || settings.name || 'Your Store Name'}</h2>
          )}
          {settings.showHeaderBranch && settings.branchName && (
             <div className="font-semibold">{settings.branchName}</div>
          )}
          {settings.tagline && (
             <div className="italic mb-1">{settings.tagline}</div>
          )}
          {settings.showHeaderAddress && (
             <div>{settings.address || '123 Main Street, City, Country'}</div>
          )}
          <div className="flex flex-col items-center justify-center">
            {settings.showHeaderPhone && <div>Tel: {settings.phone || '123-456-7890'}</div>}
            {settings.showHeaderEmail && <div>{settings.email || 'hello@store.com'}</div>}
            {settings.showHeaderWebsite && <div>{settings.website || 'www.store.com'}</div>}
          </div>
          <div className="flex flex-col items-center justify-center mt-1">
            {settings.showHeaderNTN && <div>NTN: 1234567-8</div>}
            {settings.showHeaderSTRN && <div>STRN: 987654321</div>}
            {settings.showHeaderGST && <div>GST: GST-456-789</div>}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-dashed border-slate-300 w-full"></div>

        {/* RECEIPT INFO SECTION */}
        <div className="grid grid-cols-2 gap-1">
          {settings.showInvoiceNumber !== 'hidden' && (
            <>
              <div className={settings.showInvoiceNumber === 'bold' ? 'font-bold' : ''}>Invoice:</div>
              <div className={`text-right ${settings.showInvoiceNumber === 'bold' ? 'font-bold' : ''}`}>INV-2026-0709</div>
            </>
          )}
          {settings.showDate !== 'hidden' && (
            <>
              <div>Date:</div>
              <div className="text-right">09/07/2026</div>
            </>
          )}
          {settings.showTime !== 'hidden' && (
            <>
              <div>Time:</div>
              <div className="text-right">14:30 PM</div>
            </>
          )}
          {settings.showCashier !== 'hidden' && (
            <>
              <div>Cashier:</div>
              <div className="text-right">John Doe</div>
            </>
          )}
          {settings.showCounterNumber !== 'hidden' && (
            <>
              <div>Counter:</div>
              <div className="text-right">Register 1</div>
            </>
          )}
          {settings.showCustomerName !== 'hidden' && (
            <>
              <div className="mt-1 font-semibold">Customer:</div>
              <div className="mt-1 text-right">Jane Smith</div>
            </>
          )}
          {settings.showCustomerPhone !== 'hidden' && (
            <>
              <div>Phone:</div>
              <div className="text-right">555-0198</div>
            </>
          )}
        </div>

        {/* DIVIDER */}
        <div className="border-t border-dashed border-slate-300 w-full"></div>

        {/* PRODUCTS SECTION */}
        <div className="w-full">
          {settings.productViewMode === 'table' ? (
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dashed border-slate-300">
                    <th className="py-1">Item</th>
                    {settings.showQuantity && <th className="py-1 text-center">Qty</th>}
                    {settings.showUnitPrice && <th className="py-1 text-right">Price</th>}
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleItems.map((item, idx) => (
                    <tr key={idx} className="align-top border-b border-dotted border-slate-200 last:border-0">
                      <td className="py-1">
                        {settings.showProductName && <div className="font-semibold">{item.name}</div>}
                        {settings.showVariant && item.variant && <div className="text-slate-500">- {item.variant}</div>}
                        {settings.showSKU && <div className="text-slate-500">SKU: {item.sku}</div>}
                      </td>
                      {settings.showQuantity && <td className="py-1 text-center">{item.qty}</td>}
                      {settings.showUnitPrice && <td className="py-1 text-right">{item.price}</td>}
                      <td className="py-1 text-right font-semibold">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          ) : (
             <div className="space-y-2">
                {sampleItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="font-bold">{settings.showProductName ? item.name : 'Item'}</span>
                      <span className="font-bold">{item.total}</span>
                    </div>
                    {settings.showVariant && item.variant && <div>- {item.variant}</div>}
                    <div className="flex justify-between pl-2">
                      <span>
                        {settings.showQuantity && `${item.qty} x `}
                        {settings.showUnitPrice && `${item.price}`}
                      </span>
                      {settings.showProductDiscount && item.discount > 0 && <span>(-{item.discount})</span>}
                    </div>
                    {settings.showSKU && <div>SKU: {item.sku}</div>}
                  </div>
                ))}
             </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="border-t border-dashed border-slate-300 w-full"></div>

        {/* TOTALS SECTION */}
        <div className="space-y-1">
           {settings.showSubtotal && (
             <div className="flex justify-between">
               <span>Subtotal</span>
               <span>200.00</span>
             </div>
           )}
           {settings.showTotalDiscount && (
             <div className="flex justify-between">
               <span>Discount</span>
               <span>-5.00</span>
             </div>
           )}
           {settings.showTotalTax && (
             <div className="flex justify-between">
               <span>Tax (GST)</span>
               <span>8.00</span>
             </div>
           )}
           <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-slate-800">
             <span>GRAND TOTAL</span>
             <span>{settings.currencySymbol || '$'} 203.00</span>
           </div>
           
           {settings.showPaymentMethod !== 'hidden' && (
             <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-slate-300">
               <span>Paid (Cash)</span>
               <span>210.00</span>
             </div>
           )}
           {settings.showChangeReturned && (
             <div className="flex justify-between font-bold">
               <span>Change</span>
               <span>7.00</span>
             </div>
           )}
        </div>

        {/* FOOTER MESSAGES */}
        <div className="border-t border-dashed border-slate-300 w-full mt-2 pt-2 text-center space-y-2">
           {settings.receiptFooter && (
             <div className="font-bold">{settings.receiptFooter}</div>
           )}
           {settings.exchangePolicy && (
             <div>{settings.exchangePolicy}</div>
           )}
           {settings.termsAndConditions && (
             <div className="italic">{settings.termsAndConditions}</div>
           )}
           <div className="flex justify-center space-x-2 mt-2">
             {settings.socialFacebook && <span>FB: @{settings.socialFacebook}</span>}
             {settings.socialInstagram && <span>IG: @{settings.socialInstagram}</span>}
           </div>
        </div>

        {/* BARCODES & QR */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-4">
           {settings.showBarcodeReceipt && (
              <div className="flex flex-col items-center">
                 <div className="w-3/4 h-8 bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,transparent_2px,transparent_4px)]"></div>
                 <span className="mt-1 tracking-widest">INV20260709</span>
              </div>
           )}
           {settings.showHeaderQR && (
              <div className="mt-2">
                 <QRCodeSVG value="https://counterpro.com" size={settings.barcodeSize === 'large' ? 100 : settings.barcodeSize === 'small' ? 50 : 75} />
              </div>
           )}
        </div>

      </div>

      {/* Jagged Edge Bottom */}
      <div className="h-2 w-full bg-[radial-gradient(circle_at_4px_8px,transparent_4px,white_4px)] bg-[length:8px_8px]" style={{ backgroundSize: '8px 8px', backgroundImage: `radial-gradient(circle at 4px 8px, transparent 4px, ${settings.receiptBackground || '#ffffff'} 4px)` }}></div>
      
    </div>
  );
};
