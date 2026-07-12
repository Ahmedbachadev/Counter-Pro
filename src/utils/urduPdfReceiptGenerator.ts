import jsPDF from 'jspdf';

export interface SaleItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'card' | 'credit';

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  tax: number;
  discount: number;
  finalAmount: number;
  amountPaid: number;
  change: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  cashierId: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  pendingAmount: number;
  createdAt: Date;
}

export interface ShopSettings {
  name: string;
  nameUrdu: string;
  address: string;
  addressUrdu: string;
  phone: string;
  email: string;
  taxRate: number;
  logo?: string;
  showLogoReceipt?: boolean;
}

export interface ReceiptData {
  sale: Sale;
  customer?: Customer;
  shopInfo: ShopSettings;
}

const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64', error);
    return '';
  }
};

export const generateUrduPDFReceipt = async (data: ReceiptData): Promise<void> => {
  const { sale, customer, shopInfo } = data;
  
  // FIX: Exit if sale object is null/undefined
  if (!sale) {
    console.error("Sale data is missing for Urdu PDF receipt generation.");
    return;
  }
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font for Urdu (using helvetica as fallback)
  doc.setFont('helvetica');

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Helper function to add text with RTL support
  const addUrduText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 10);
    doc.setFont('helvetica', options.style || 'normal');
    
    if (options.align === 'center') {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    } else if (options.align === 'right') {
      doc.text(text, pageWidth - margin, y, { align: 'right' });
    } else {
      doc.text(text, x, y);
    }
  };

  // Helper function to format currency in Urdu
  const formatUrduCurrency = (amount: number) => {
    return `${amount.toFixed(2)} روپے`;
  };

  // Helper function to get payment method text in Urdu
  const getUrduPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return 'نقد';
      case 'card': return 'کارڈ';
      case 'credit': return 'ادھار';
      default: return method;
    }
  };

  // Header - Shop Name in Urdu
  // Header - Shop Logo
  if (shopInfo.showLogoReceipt && shopInfo.logo) {
    try {
      let logoDataUrl = shopInfo.logo;
      if (shopInfo.logo.startsWith('http')) {
        logoDataUrl = await urlToBase64(shopInfo.logo);
      }
      
      if (logoDataUrl && logoDataUrl.startsWith('data:image')) {
        const imgProps = doc.getImageProperties(logoDataUrl);
        const logoWidth = 30; // Max width in mm
        const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
        doc.addImage(logoDataUrl, imgProps.fileType || 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
        yPos += logoHeight + 5;
      }
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }
  }

  // Header - Shop Name in Urdu
  addUrduText(shopInfo.nameUrdu, 0, yPos, { 
    fontSize: 18, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 10;

  // Shop Address in Urdu
  addUrduText(shopInfo.addressUrdu, 0, yPos, { 
    fontSize: 10, 
    align: 'center' 
  });
  yPos += 6;

  // Shop Phone
  addUrduText(`فون: ${shopInfo.phone}`, 0, yPos, { 
    fontSize: 10, 
    align: 'center' 
  });
  yPos += 6;

  // Shop Email
  if (shopInfo.email) {
    addUrduText(`ای میل: ${shopInfo.email}`, 0, yPos, { 
      fontSize: 10, 
      align: 'center' 
    });
    yPos += 6;
  }

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Receipt Title in Urdu
  addUrduText('سیلز رسید', 0, yPos, { 
    fontSize: 16, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 15;

  // Receipt Details in Urdu
  addUrduText(`رسید نمبر: ${sale.id}`, margin, yPos);
  yPos += 6;

  addUrduText(`تاریخ: ${sale.createdAt.toLocaleDateString()} ${sale.createdAt.toLocaleTimeString()}`, margin, yPos);
  yPos += 6;

  addUrduText(`کیشیئر: ${sale.cashierId}`, margin, yPos);
  yPos += 6;

  addUrduText(`ادائیگی: ${getUrduPaymentMethodText(sale.paymentMethod)}`, margin, yPos);
  yPos += 6;

  addUrduText(`کسٹمر: ${customer ? customer.name : 'واک ان کسٹمر'}`, margin, yPos);
  yPos += 6;

  if (customer && customer.phone) {
    addUrduText(`فون: ${customer.phone}`, margin, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Items header in Urdu (right to left)
  addUrduText('کل', margin + 150, yPos, { style: 'bold' });
  addUrduText('قیمت', margin + 110, yPos, { style: 'bold' });
  addUrduText('تعداد', margin + 80, yPos, { style: 'bold' });
  addUrduText('اشیاء', margin, yPos, { style: 'bold' });
  yPos += 8;

  // Line under header
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Items
  sale.items.forEach((item) => {
    addUrduText(formatUrduCurrency(item.subtotal), margin + 150, yPos);
    addUrduText(formatUrduCurrency(item.product.price), margin + 110, yPos);
    addUrduText(item.quantity.toString(), margin + 80, yPos);
    addUrduText(item.product.name, margin, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Totals in Urdu
  addUrduText('ذیلی کل:', margin + 100, yPos);
  addUrduText(formatUrduCurrency(sale.total), margin + 150, yPos);
  yPos += 6;

  if (sale.discount > 0) {
    addUrduText('رعایت:', margin + 100, yPos);
    addUrduText(formatUrduCurrency(sale.discount), margin + 150, yPos);
    yPos += 6;
  }

  // Final total
  doc.line(margin + 100, yPos, pageWidth - margin, yPos);
  yPos += 5;
  addUrduText('کل رقم:', margin + 100, yPos, { style: 'bold' });
  addUrduText(formatUrduCurrency(sale.finalAmount), margin + 150, yPos, { style: 'bold' });
  yPos += 10;

  // Payment details in Urdu
  addUrduText('ادا شدہ رقم:', margin + 100, yPos);
  addUrduText(formatUrduCurrency(sale.amountPaid), margin + 150, yPos);
  yPos += 6;

  if (sale.change > 0) {
    addUrduText('واپسی:', margin + 100, yPos);
    addUrduText(formatUrduCurrency(sale.change), margin + 150, yPos);
    yPos += 6;
  }

  if (sale.dueAmount > 0) {
    addUrduText('باقی رقم:', margin + 100, yPos);
    addUrduText(formatUrduCurrency(sale.dueAmount), margin + 150, yPos);
    yPos += 6;
  }

  yPos += 15;

  // Footer in Urdu
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  addUrduText('آپ کے کاروبار کے لیے شکریہ!', 0, yPos, { 
    fontSize: 12, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 8;

  addUrduText('براہ کرم یہ رسید اپنے ریکارڈ کے لیے محفوظ رکھیے', 0, yPos, { 
    fontSize: 9, 
    align: 'center' 
  });
  yPos += 6;

  addUrduText('واپسی کی پالیسی: اشیاء رسید کے ساتھ ۷ دن کے اندر واپس کی جا سکتی ہیں', 0, yPos, { 
    fontSize: 8, 
    align: 'center' 
  });

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `receipt_${sale.id}_ur_${timestamp}.pdf`;

  // Save the PDF
  doc.save(filename);
};