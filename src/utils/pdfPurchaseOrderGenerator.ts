import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { PurchaseOrder } from '../stores/purchaseStore';
import { ShopSettings } from './database';

export const generatePurchaseOrderPDF = (order: PurchaseOrder, shopInfo: ShopSettings): void => {
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

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

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
  addText(`PURCHASE ORDER: ${order.purchaseNumber}`, 0, yPos, { 
    fontSize: 14, 
    style: 'bold', 
    align: 'center' 
  });
  yPos += 12;

  // 2-Column Info: PO Info (Left) & Supplier Info (Right)
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 5;

  addText('ORDER DETAILS:', leftCol, yPos, { fontSize: 11, style: 'bold' });
  addText('SUPPLIER:', rightCol, yPos, { fontSize: 11, style: 'bold' });
  yPos += 6;

  addText(`PO Number: ${order.purchaseNumber}`, leftCol, yPos);
  addText(`Name: ${order.supplierName}`, rightCol, yPos);
  yPos += 5;

  addText(`Status: ${order.status}`, leftCol, yPos);
  addText(`Date: ${format(new Date(order.purchaseDate), 'yyyy-MM-dd')}`, leftCol, yPos + 5);
  addText(`Expected Delivery: ${format(new Date(order.expectedDeliveryDate), 'yyyy-MM-dd')}`, leftCol, yPos + 10);
  yPos += 15;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Products table header
  addText('PRODUCT', margin, yPos, { style: 'bold' });
  addText('COST', margin + 75, yPos, { style: 'bold' });
  addText('ORDERED', margin + 105, yPos, { style: 'bold' });
  addText('RECEIVED', margin + 130, yPos, { style: 'bold' });
  addText('TOTAL', margin + 155, yPos, { style: 'bold' });
  yPos += 5;

  // Line under header
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Products
  order.items.forEach((item) => {
    // Check if space left is enough, otherwise add a page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
      // Add thin line at the top
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
    }

    const subtotal = item.quantity * item.costPrice;
    addText(item.productName, margin, yPos);
    addText(formatCurrency(item.costPrice), margin + 75, yPos);
    addText(item.quantity.toString(), margin + 105, yPos);
    addText(item.receivedQty.toString(), margin + 130, yPos);
    addText(formatCurrency(subtotal), margin + 155, yPos);
    yPos += 6;
  });

  yPos += 4;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Financial details & summary
  const summaryLeft = pageWidth - margin - 80;
  const summaryRight = pageWidth - margin;

  const itemSubtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  addText('Items Subtotal:', summaryLeft, yPos);
  addText(formatCurrency(itemSubtotal), summaryRight, yPos, { align: 'right' });
  yPos += 5;

  if (order.discount > 0) {
    addText('Discount:', summaryLeft, yPos);
    addText(`-${formatCurrency(order.discount)}`, summaryRight, yPos, { align: 'right' });
    yPos += 5;
  }

  if (order.tax > 0) {
    addText('Tax:', summaryLeft, yPos);
    addText(`+${formatCurrency(order.tax)}`, summaryRight, yPos, { align: 'right' });
    yPos += 5;
  }

  if (order.shippingCost > 0) {
    addText('Shipping Cost:', summaryLeft, yPos);
    addText(formatCurrency(order.shippingCost), summaryRight, yPos, { align: 'right' });
    yPos += 5;
  }

  if (order.additionalCharges > 0) {
    addText('Additional Charges:', summaryLeft, yPos);
    addText(formatCurrency(order.additionalCharges), summaryRight, yPos, { align: 'right' });
    yPos += 5;
  }

  addText('Total Amount:', summaryLeft, yPos, { style: 'bold' });
  addText(formatCurrency(order.totalAmount), summaryRight, yPos, { style: 'bold', align: 'right' });
  yPos += 5;

  addText('Amount Paid:', summaryLeft, yPos);
  addText(formatCurrency(order.amountPaid), summaryRight, yPos, { align: 'right' });
  yPos += 5;

  addText('Remaining Balance:', summaryLeft, yPos, { style: 'bold' });
  addText(formatCurrency(order.remainingBalance), summaryRight, yPos, { style: 'bold', align: 'right' });
  yPos += 15;

  if (order.notes) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    addText('Notes:', margin, yPos, { style: 'bold' });
    yPos += 5;
    addText(order.notes, margin, yPos);
    yPos += 15;
  }

  // Footer
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  addText('Generated automatically by Counter Pro POS system.', 0, yPos, { 
    fontSize: 9, 
    style: 'italic', 
    align: 'center' 
  });

  // Save the PDF
  const filename = `${order.purchaseNumber}_${order.supplierName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
