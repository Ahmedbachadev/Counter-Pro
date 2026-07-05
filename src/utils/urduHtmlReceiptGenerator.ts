export interface ReceiptData {
  sale: {
    id: string;
    items: Array<{
      product: { name: string; price: number };
      quantity: number;
      subtotal: number;
    }>;
    total: number;
    tax: number;
    discount: number;
    finalAmount: number;
    amountPaid: number;
    change: number;
    dueAmount: number;
    paymentMethod: string;
    customerId?: string;
    cashierId: string;
    createdAt: Date;
  };
  customer?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  shopInfo: {
    name: string;
    nameUrdu: string;
    address: string;
    addressUrdu: string;
    phone: string;
    email: string;
  };
}

export const generateUrduHtmlReceipt = (data: ReceiptData): void => {
  try {
    // Check for sale data
    if (!data.sale) {
      console.error("Sale data is missing for Urdu HTML receipt generation.");
      // Removed the alert() as per platform guidelines.
      return;
    }

    // Helper function for creating detail rows
    const detailRow = (label: string, value: string | number) => `
      <div class="detail-row">
        <span>${label}</span>
        <span class="value">${value}</span>
      </div>
    `;

    const receiptHtml = `
<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسید - ${data.sale.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Noto Nastaliq Urdu', serif;
      font-size: 13px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      padding: 12px;
      direction: rtl; /* Ensures overall RTL flow */
      text-align: right; /* Aligns all block content to the right */
    }
    .receipt {
      max-width: 340px;
      margin: 0 auto;
      background: #fff;
    }
    h3 {
      margin: 4px 0;
      font-weight: 700;
      text-align: center; /* Center the shop name */
    }
    p {
      margin: 2px 0;
      text-align: center; /* Center shop details and footer */
    }
    .header-details, .totals {
        text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      direction: rtl;
    }
    th, td {
      text-align: right;
      padding: 3px 0;
      font-size: 12px;
    }
    /* Ensure the price column (last column) is visually right-aligned for numbers */
    th:last-child, td:last-child {
        text-align: left; /* Aligns the actual price value to the left edge of the cell */
    }
    
    .totals {
      margin-top: 6px;
    }
    
    /* Key change for RTL detail alignment using Flexbox */
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 13px;
    }
    .detail-row .value {
        /* LTR direction for numbers */
        direction: ltr; 
    }
    
    .final-amount .value {
        font-weight: 700;
        font-size: 15px;
    }
    
    hr {
      border: none;
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      margin-top: 8px;
    }
    @media print {
        body {
            font-size: 11px;
            padding: 0;
        }
        .receipt {
            max-width: none;
        }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <h3>${data.shopInfo.nameUrdu}</h3>
    <p>${data.shopInfo.addressUrdu}</p>
    <p>فون: ${data.shopInfo.phone}</p>
    <hr>
    
    <!-- Sale Details Section: Using Flexbox for clean alignment -->
    <div class="header-details">
      ${detailRow("رسید نمبر:", data.sale.id)}
      ${detailRow("تاریخ:", new Date(data.sale.createdAt).toLocaleDateString("ur-PK"))}
      ${data.customer ? detailRow("کسٹمر:", data.customer.name) : ""}
    </div>
    <hr>
    
    <table>
      <thead>
        <tr>
          <th>پروڈکٹ</th>
          <th>تعداد</th>
          <th>قیمت</th>
        </tr>
      </thead>
      <tbody>
        ${data.sale.items
          .map(
            (item) => `
            <tr>
              <td>${item.product.name}</td>
              <td>${item.quantity}</td>
              <td>${item.subtotal.toFixed(0)}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
    <hr>
    
    <!-- Totals Section: Using Flexbox for clean alignment -->
    <div class="totals">
      ${detailRow("کل:", data.sale.total.toFixed(0))}
      ${detailRow("ٹیکس:", data.sale.tax.toFixed(0))}
      ${detailRow("رعایت:", data.sale.discount.toFixed(0))}
      <hr>
      <div class="detail-row final-amount">
          <strong><span>کل رقم:</span></strong>
          <span class="value">${data.sale.finalAmount.toFixed(0)}</span>
      </div>
      <hr>
      ${detailRow("ادا شدہ:", data.sale.amountPaid.toFixed(0))}
      ${detailRow("بقایا:", data.sale.dueAmount.toFixed(0))}
    </div>
    <hr>
    
    <div class="footer">
      <p>شکریہ! دوبارہ تشریف لائیں۔</p>
    </div>
  </div>
</body>
</html>`;

    // Opens in a new window for printing
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      // Optional: auto-print
      printWindow.print();
    }
  } catch (error) {
    console.error("Error generating Urdu HTML receipt:", error);
  }
};
