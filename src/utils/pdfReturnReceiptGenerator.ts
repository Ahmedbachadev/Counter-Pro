import jsPDF from 'jspdf';

export interface ReturnReceiptData {
  returnRecord: {
    id: string;
    originalSaleId: number;
    customerId?: number;
    customerName?: string;
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      price: number;
      reason: string;
      condition: string;
    }>;
    exchangeItems: Array<{
      productId: number;
      productName: string;
      quantity: number;
      price: number;
    }>;
    refundAmount: number;
    exchangeAmount: number;
    netRefund: number;
    paymentMethod: string;
    cashierId: string;
    createdAt: string;
  };
  shopInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
}

export const generatePDFReturnReceipt = (data: ReturnReceiptData): void => {
  const { returnRecord, shopInfo } = data;

  if (!returnRecord) {
    console.error("Return data is missing for PDF receipt generation.");
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFont('helvetica');

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

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
    return `Rs. ${Math.abs(amount).toFixed(2)}`;
  };

  // 1. Header Shop Info
  addText(shopInfo.name, 0, yPos, { fontSize: 18, style: 'bold', align: 'center' });
  yPos += 10;
  addText(shopInfo.address, 0, yPos, { fontSize: 10, align: 'center' });
  yPos += 6;
  addText(`Phone: ${shopInfo.phone}`, 0, yPos, { fontSize: 10, align: 'center' });
  yPos += 6;
  if (shopInfo.email) {
    addText(`Email: ${shopInfo.email}`, 0, yPos, { fontSize: 10, align: 'center' });
    yPos += 6;
  }

  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // 2. Receipt Title
  addText('RETURNS & EXCHANGES RECEIPT', 0, yPos, { fontSize: 16, style: 'bold', align: 'center' });
  yPos += 15;

  // 3. Receipt Info Details
  addText(`Return ID: ${returnRecord.id}`, margin, yPos);
  yPos += 6;
  addText(`Original Invoice: #${returnRecord.originalSaleId}`, margin, yPos);
  yPos += 6;
  addText(`Date: ${new Date(returnRecord.createdAt).toLocaleString()}`, margin, yPos);
  yPos += 6;
  addText(`Cashier: ${returnRecord.cashierId}`, margin, yPos);
  yPos += 6;
  addText(`Client Account: ${returnRecord.customerName || 'Walk-in Customer'}`, margin, yPos);
  yPos += 6;
  addText(`Adjustment Method: ${returnRecord.paymentMethod.toUpperCase()}`, margin, yPos);
  
  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // 4. Returned Items Table
  if (returnRecord.items && returnRecord.items.length > 0) {
    addText('RETURNED ITEMS', margin, yPos, { style: 'bold', fontSize: 11 });
    yPos += 8;

    addText('ITEM', margin, yPos, { style: 'bold', fontSize: 9 });
    addText('QTY', margin + 70, yPos, { style: 'bold', fontSize: 9 });
    addText('PRICE', margin + 95, yPos, { style: 'bold', fontSize: 9 });
    addText('REASON', margin + 120, yPos, { style: 'bold', fontSize: 9 });
    addText('CONDITION', margin + 155, yPos, { style: 'bold', fontSize: 9 });
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    returnRecord.items.forEach((item) => {
      addText(item.productName, margin, yPos, { fontSize: 9 });
      addText(item.quantity.toString(), margin + 70, yPos, { fontSize: 9 });
      addText(formatCurrency(item.price), margin + 95, yPos, { fontSize: 9 });
      addText(item.reason || 'General', margin + 120, yPos, { fontSize: 8 });
      addText(item.condition, margin + 155, yPos, { fontSize: 9 });
      yPos += 6;
    });

    yPos += 4;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  }

  // 5. Exchanged Items Table
  if (returnRecord.exchangeItems && returnRecord.exchangeItems.length > 0) {
    addText('EXCHANGED (NEW) ITEMS', margin, yPos, { style: 'bold', fontSize: 11 });
    yPos += 8;

    addText('ITEM', margin, yPos, { style: 'bold', fontSize: 9 });
    addText('QTY', margin + 80, yPos, { style: 'bold', fontSize: 9 });
    addText('UNIT PRICE', margin + 110, yPos, { style: 'bold', fontSize: 9 });
    addText('SUBTOTAL', margin + 150, yPos, { style: 'bold', fontSize: 9 });
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    returnRecord.exchangeItems.forEach((item) => {
      addText(item.productName, margin, yPos, { fontSize: 9 });
      addText(item.quantity.toString(), margin + 80, yPos, { fontSize: 9 });
      addText(formatCurrency(item.price), margin + 110, yPos, { fontSize: 9 });
      addText(formatCurrency(item.price * item.quantity), margin + 150, yPos, { fontSize: 9 });
      yPos += 6;
    });

    yPos += 4;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  }

  // 6. Summary Totals Ledger
  addText('SUMMARY ACCOUNTING LEDGER', margin + 90, yPos, { style: 'bold', fontSize: 11 });
  yPos += 8;

  addText('Total Returned Amount:', margin + 90, yPos);
  addText(formatCurrency(returnRecord.refundAmount), margin + 160, yPos, { align: 'right' });
  yPos += 6;

  addText('Total Exchange Items Value:', margin + 90, yPos);
  addText(formatCurrency(returnRecord.exchangeAmount), margin + 160, yPos, { align: 'right' });
  yPos += 6;

  doc.line(margin + 90, yPos, pageWidth - margin, yPos);
  yPos += 5;

  const isDueFromCustomer = returnRecord.netRefund < 0;
  addText(isDueFromCustomer ? 'Additional Amount Paid By Customer:' : 'Net Refund Amount Returned To Customer:', margin + 90, yPos, { style: 'bold' });
  addText(formatCurrency(returnRecord.netRefund), margin + 160, yPos, { align: 'right', style: 'bold' });
  
  yPos += 15;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  addText('Thank you for choosing Counter Pro!', 0, yPos, { fontSize: 11, style: 'bold', align: 'center' });
  yPos += 6;
  addText('Please retain this receipt for returns/exchanges record references.', 0, yPos, { fontSize: 8, align: 'center' });

  // Save the PDF Return Receipt
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `return_receipt_${returnRecord.id}_${timestamp}.pdf`;
  doc.save(filename);
};
