import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface SupplierInvoiceData {
  supplier: {
    id: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  products: Array<{
    id: number;
    name: string;
    cost: number;
    stock: number;
    createdAt: string;
  }>;
  shopInfo: {
    name: string;
    nameUrdu: string;
    address: string;
    addressUrdu: string;
    phone: string;
    email: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export const generateSupplierInvoice = (data: SupplierInvoiceData, language: 'en' | 'ur' = 'en'): void => {
  const { supplier, products, shopInfo, dateRange } = data;
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font
  doc.setFont('helvetica');

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

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
    return language === 'ur' ? `${amount.toFixed(2)} روپے` : `Rs. ${amount.toFixed(2)}`;
  };

  if (language === 'en') {
    // English Invoice
    
    // Header - Shop Name
    addText(shopInfo.name, 0, yPos, { 
      fontSize: 18, 
      style: 'bold', 
      align: 'center' 
    });
    yPos += 10;

    // Shop Details
    addText(shopInfo.address, 0, yPos, { fontSize: 10, align: 'center' });
    yPos += 6;
    addText(`Phone: ${shopInfo.phone} | Email: ${shopInfo.email}`, 0, yPos, { fontSize: 10, align: 'center' });
    yPos += 15;

    // Invoice Title
    addText('SUPPLIER INVOICE', 0, yPos, { 
      fontSize: 16, 
      style: 'bold', 
      align: 'center' 
    });
    yPos += 15;

    // Supplier Details
    addText('SUPPLIER DETAILS:', margin, yPos, { fontSize: 12, style: 'bold' });
    yPos += 8;
    
    addText(`Name: ${supplier.name}`, margin, yPos);
    yPos += 6;
    
    if (supplier.contactPerson) {
      addText(`Contact Person: ${supplier.contactPerson}`, margin, yPos);
      yPos += 6;
    }
    
    if (supplier.phone) {
      addText(`Phone: ${supplier.phone}`, margin, yPos);
      yPos += 6;
    }
    
    if (supplier.email) {
      addText(`Email: ${supplier.email}`, margin, yPos);
      yPos += 6;
    }
    
    if (supplier.address) {
      addText(`Address: ${supplier.address}`, margin, yPos);
      yPos += 6;
    }

    yPos += 10;

    // Date Range
    addText(`Period: ${dateRange.start} to ${dateRange.end}`, margin, yPos, { style: 'bold' });
    yPos += 10;

    // Line separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Products header
    addText('PRODUCT', margin, yPos, { style: 'bold' });
    addText('COST', margin + 80, yPos, { style: 'bold' });
    addText('STOCK', margin + 120, yPos, { style: 'bold' });
    addText('TOTAL', margin + 150, yPos, { style: 'bold' });
    yPos += 8;

    // Line under header
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Products
    let totalAmount = 0;
    products.forEach((product) => {
      const productTotal = product.cost * product.stock;
      totalAmount += productTotal;
      
      addText(product.name, margin, yPos);
      addText(formatCurrency(product.cost), margin + 80, yPos);
      addText(product.stock.toString(), margin + 120, yPos);
      addText(formatCurrency(productTotal), margin + 150, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Line separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Total
    addText('TOTAL AMOUNT:', margin + 100, yPos, { style: 'bold' });
    addText(formatCurrency(totalAmount), margin + 150, yPos, { style: 'bold' });
    yPos += 15;

    // Footer
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    addText('Thank you for your business partnership!', 0, yPos, { 
      fontSize: 12, 
      style: 'bold', 
      align: 'center' 
    });

  } else {
    // Urdu Invoice
    
    // Header - Shop Name in Urdu
    addText(shopInfo.nameUrdu, 0, yPos, { 
      fontSize: 18, 
      style: 'bold', 
      align: 'center' 
    });
    yPos += 10;

    // Shop Details in Urdu
    addText(shopInfo.addressUrdu, 0, yPos, { fontSize: 10, align: 'center' });
    yPos += 6;
    addText(`فون: ${shopInfo.phone} | ای میل: ${shopInfo.email}`, 0, yPos, { fontSize: 10, align: 'center' });
    yPos += 15;

    // Invoice Title in Urdu
    addText('سپلائر انوائس', 0, yPos, { 
      fontSize: 16, 
      style: 'bold', 
      align: 'center' 
    });
    yPos += 15;

    // Supplier Details in Urdu
    addText('سپلائر کی تفصیلات:', margin, yPos, { fontSize: 12, style: 'bold' });
    yPos += 8;
    
    addText(`نام: ${supplier.name}`, margin, yPos);
    yPos += 6;
    
    if (supplier.contactPerson) {
      addText(`رابطہ کار: ${supplier.contactPerson}`, margin, yPos);
      yPos += 6;
    }
    
    if (supplier.phone) {
      addText(`فون: ${supplier.phone}`, margin, yPos);
      yPos += 6;
    }
    
    if (supplier.email) {
      addText(`ای میل: ${supplier.email}`, margin, yPos);
      yPos += 6;
    }
    
    if (supplier.address) {
      addText(`پتہ: ${supplier.address}`, margin, yPos);
      yPos += 6;
    }

    yPos += 10;

    // Date Range in Urdu
    addText(`مدت: ${dateRange.start} سے ${dateRange.end}`, margin, yPos, { style: 'bold' });
    yPos += 10;

    // Line separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Products header in Urdu
    addText('کل', margin + 150, yPos, { style: 'bold' });
    addText('اسٹاک', margin + 120, yPos, { style: 'bold' });
    addText('قیمت', margin + 80, yPos, { style: 'bold' });
    addText('پروڈکٹ', margin, yPos, { style: 'bold' });
    yPos += 8;

    // Line under header
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Products
    let totalAmount = 0;
    products.forEach((product) => {
      const productTotal = product.cost * product.stock;
      totalAmount += productTotal;
      
      addText(formatCurrency(productTotal), margin + 150, yPos);
      addText(product.stock.toString(), margin + 120, yPos);
      addText(formatCurrency(product.cost), margin + 80, yPos);
      addText(product.name, margin, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Line separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Total in Urdu
    addText('کل رقم:', margin + 100, yPos, { style: 'bold' });
    addText(formatCurrency(totalAmount), margin + 150, yPos, { style: 'bold' });
    yPos += 15;

    // Footer in Urdu
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    addText('کاروباری شراکت کے لیے شکریہ!', 0, yPos, { 
      fontSize: 12, 
      style: 'bold', 
      align: 'center' 
    });
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `supplier_invoice_${supplier.name.replace(/\s+/g, '_')}_${language}_${timestamp}.pdf`;

  // Save the PDF
  doc.save(filename);
};