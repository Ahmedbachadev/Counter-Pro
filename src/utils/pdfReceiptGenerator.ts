import jsPDF from 'jspdf';

// Add Arabic font support
const addArabicFont = (doc: jsPDF) => {
  // Use a web-safe Arabic font fallback approach
  doc.setFont('helvetica');
  doc.setLanguage('ar');
};

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

// Internal helper: builds and returns the jsPDF document
const buildReceiptDoc = (data: ReceiptData): { doc: jsPDF; filename: string } | null => {
  const { sale, customer, shopInfo } = data;
  
  // FIX: Exit if sale object is null/undefined
  if (!sale) {
    console.error("Sale data is missing for PDF receipt generation.");
    return;
  }
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font for English
  doc.setFont('helvetica');

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: any = {}) => {
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

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  // Helper function to get payment method text
  const getPaymentMethodText = (method: PaymentMethod) => {
    return method.toUpperCase();
  };

  // English Labels
  const labels = {
    receiptTitle: 'SALES RECEIPT',
    receiptNo: 'Receipt #',
    date: 'Date',
    cashier: 'Cashier',
    payment: 'Payment',
    customer: 'Customer',
    walkInCustomer: 'Walk-in Customer',
    phone: 'Phone',
    item: 'ITEM',
    qty: 'QTY',
    price: 'PRICE',
    total: 'TOTAL',
    subtotal: 'Subtotal',
    tax: 'Tax',
    discount: 'Discount',
    finalTotal: 'TOTAL',
    amountPaid: 'Amount Paid',
    change: 'Change',
    dueAmount: 'Due Amount',
    thankYou: 'Thank you for your business!',
    keepReceipt: 'Please keep this receipt for your records',
    returnPolicy: 'we have every kind of electrical and sanitary items from the market'
  };

  // Header - Shop Logo
  if (shopInfo.showLogoReceipt && shopInfo.logo && shopInfo.logo.startsWith('data:image')) {
    try {
      const imgProps = doc.getImageProperties(shopInfo.logo);
      const logoWidth = 30; // Max width in mm
      const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
      doc.addImage(shopInfo.logo, imgProps.fileType || 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 5;
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }
  }

  // Header - Shop Name
  addText(shopInfo.name, 0, yPos, { 
    fontSize: 18, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 10;

  // Shop Address
  addText(shopInfo.address, 0, yPos, { 
    fontSize: 10, 
    align: 'center' 
  });
  yPos += 6;

  // Shop Phone
  addText(`Phone: ${shopInfo.phone}`, 0, yPos, { 
    fontSize: 10, 
    align: 'center' 
  });
  yPos += 6;

  // Shop Email
  if (shopInfo.email) {
    addText(`Email: ${shopInfo.email}`, 0, yPos, { 
      fontSize: 10, 
      align: 'center' 
    });
    yPos += 6;
  }

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Receipt Title
  addText(labels.receiptTitle, 0, yPos, { 
    fontSize: 16, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 15;

  // Receipt Details
  addText(`${labels.receiptNo}: ${sale.id}`, margin, yPos);
  yPos += 6;

  addText(`${labels.date}: ${sale.createdAt.toLocaleDateString()} ${sale.createdAt.toLocaleTimeString()}`, margin, yPos);
  yPos += 6;

  addText(`${labels.cashier}: ${sale.cashierId}`, margin, yPos);
  yPos += 6;

  addText(`${labels.payment}: ${getPaymentMethodText(sale.paymentMethod)}`, margin, yPos);
  yPos += 6;

  addText(`${labels.customer}: ${customer ? customer.name : labels.walkInCustomer}`, margin, yPos);
  yPos += 6;

  if (customer && customer.phone) {
    addText(`${labels.phone}: ${customer.phone}`, margin, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Items header
  addText(labels.item, margin, yPos, { style: 'bold' });
  addText(labels.qty, margin + 80, yPos, { style: 'bold' });
  addText(labels.price, margin + 110, yPos, { style: 'bold' });
  addText(labels.total, margin + 150, yPos, { style: 'bold' });
  yPos += 8;

  // Line under header
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Items
  sale.items.forEach((item) => {
    addText(item.product.name, margin, yPos);
    addText(item.quantity.toString(), margin + 80, yPos);
    addText(formatCurrency(item.product.price), margin + 110, yPos);
    addText(formatCurrency(item.subtotal), margin + 150, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Totals
  addText(`${labels.subtotal}:`, margin + 100, yPos);
  addText(formatCurrency(sale.total), margin + 150, yPos);
  yPos += 6;

  if (sale.discount > 0) {
    addText(`${labels.discount}:`, margin + 100, yPos);
    addText(formatCurrency(sale.discount), margin + 150, yPos);
    yPos += 6;
  }

  // Final total
  doc.line(margin + 100, yPos, pageWidth - margin, yPos);
  yPos += 5;
  addText(`${labels.finalTotal}:`, margin + 100, yPos, { style: 'bold' });
  addText(formatCurrency(sale.finalAmount), margin + 150, yPos, { style: 'bold' });
  yPos += 10;

  // Payment details
  addText(`${labels.amountPaid}:`, margin + 100, yPos);
  addText(formatCurrency(sale.amountPaid), margin + 150, yPos);
  yPos += 6;

  if (sale.change > 0) {
    addText(`${labels.change}:`, margin + 100, yPos);
    addText(formatCurrency(sale.change), margin + 150, yPos);
    yPos += 6;
  }

  if (sale.dueAmount > 0) {
    addText(`${labels.dueAmount}:`, margin + 100, yPos);
    addText(formatCurrency(sale.dueAmount), margin + 150, yPos);
    yPos += 6;
  }

  yPos += 15;

  // Footer
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  addText(labels.thankYou, 0, yPos, { 
    fontSize: 12, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 8;

  addText(labels.keepReceipt, 0, yPos, { 
    fontSize: 9, 
    align: 'center' 
  });
  yPos += 6;

  addText(labels.returnPolicy, 0, yPos, { 
    fontSize: 8, 
    align: 'center' 
  });

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `receipt_${sale.id}_en_${timestamp}.pdf`;

  return { doc, filename };
};

/**
 * Downloads the receipt as a PDF file.
 */
export const downloadPDFReceipt = (data: ReceiptData): void => {
  const result = buildReceiptDoc(data);
  if (!result) return;
  const { doc, filename } = result;
  doc.save(filename);
};

/**
 * Opens the receipt in a small print popup window and triggers the browser print dialog.
 */
export const printPDFReceipt = (data: ReceiptData): void => {
  const result = buildReceiptDoc(data);
  if (!result) return;
  const { doc } = result;

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(
    url,
    '_blank',
    'width=800,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
  );

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
};

/**
 * Silently saves/downloads the receipt PDF (used for auto-save on sale completion).
 */
export const savePDFReceipt = (data: ReceiptData): void => {
  const result = buildReceiptDoc(data);
  if (!result) return;
  const { doc, filename } = result;
  doc.save(filename);
};

/**
 * @deprecated Use downloadPDFReceipt or printPDFReceipt instead.
 * Kept for backward compatibility.
 */
export const generatePDFReceipt = downloadPDFReceipt;