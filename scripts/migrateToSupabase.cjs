const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const dbPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'khata-book', 'sanishop.db') : '';
if (!fs.existsSync(dbPath)) {
  console.error('Local SQLite database not found at', dbPath);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

async function runMigration() {
  console.log('Starting migration to Supabase...');

  // 1. Get or create Workspace
  let workspaceId;
  const { data: wsData } = await supabase.from('workspaces').select('id').limit(1).single();
  if (wsData) {
    workspaceId = wsData.id;
  } else {
    const { data: newWs } = await supabase.from('workspaces').insert({ name: 'Counter Pro', slug: 'counter-pro' }).select('id').single();
    workspaceId = newWs.id;
  }
  console.log('Using workspace:', workspaceId);

  // Map to store old IDs to new UUIDs if necessary, but we can just use the existing IDs!
  // Wait, Supabase schema uses UUID for id, but the SQLite schema used integers.
  // We can't insert integers into UUID columns. So we MUST map the old IDs to new UUIDs.
  // Alternatively, we can let Supabase generate UUIDs and map them.
  const idMap = {
    categories: {},
    suppliers: {},
    products: {},
    customers: {},
    sales: {}
  };

  try {
    // CATEGORIES
    console.log('Migrating categories...');
    const categories = db.prepare('SELECT * FROM categories').all();
    for (const cat of categories) {
      const { data } = await supabase.from('categories').insert({
        workspace_id: workspaceId,
        name: cat.name,
        name_urdu: cat.nameUrdu,
        description: cat.description
      }).select('id').single();
      if (data) idMap.categories[cat.id] = data.id;
    }

    // SUPPLIERS
    console.log('Migrating suppliers...');
    const suppliers = db.prepare('SELECT * FROM suppliers').all();
    for (const sup of suppliers) {
      const { data } = await supabase.from('suppliers').insert({
        workspace_id: workspaceId,
        name: sup.name,
        contact_person: sup.contactPerson,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        tax_id: sup.taxId,
        bank_name: sup.bankName,
        bank_account: sup.bankAccount,
        payment_terms: sup.paymentTerms,
        status: sup.status || 'Active',
        outstanding_balance: sup.outstandingBalance || 0,
        total_purchases: sup.totalPurchases || 0,
        notes: sup.notes
      }).select('id').single();
      if (data) idMap.suppliers[sup.id] = data.id;
    }

    // PRODUCTS
    console.log('Migrating products...');
    const products = db.prepare('SELECT * FROM products').all();
    for (const prod of products) {
      const { data } = await supabase.from('products').insert({
        workspace_id: workspaceId,
        category_id: idMap.categories[prod.categoryId] || null,
        supplier_id: idMap.suppliers[prod.supplierId] || null,
        name: prod.name,
        name_urdu: prod.nameUrdu,
        barcode: prod.barcode,
        sku: prod.sku,
        price: prod.price || 0,
        cost: prod.cost || 0,
        stock: prod.stock || 0,
        initial_stock: prod.initialStock || prod.stock || 0,
        min_stock: prod.minStock || 0,
        description: prod.description,
        primary_image_url: prod.image,
        status: prod.status || 'Active'
      }).select('id').single();
      if (data) idMap.products[prod.id] = data.id;
    }

    // CUSTOMERS
    console.log('Migrating customers...');
    const customers = db.prepare('SELECT * FROM customers').all();
    for (const cust of customers) {
      const { data } = await supabase.from('customers').insert({
        workspace_id: workspaceId,
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        address: cust.address,
        billing_address: cust.billingAddress,
        shipping_address: cust.shippingAddress,
        customer_type: cust.customerType,
        status: cust.status,
        pending_amount: cust.pendingAmount || 0,
        loyalty_points: cust.loyaltyPoints || 0,
        notes: cust.notes
      }).select('id').single();
      if (data) idMap.customers[cust.id] = data.id;
    }

    // SALES
    console.log('Migrating sales...');
    const sales = db.prepare('SELECT * FROM sales').all();
    for (const sale of sales) {
      const { data: saleData, error: saleErr } = await supabase.from('sales').insert({
        workspace_id: workspaceId,
        customer_id: idMap.customers[sale.customerId] || null,
        total: sale.total,
        tax: sale.tax,
        discount: sale.discount,
        discount_type: sale.discountType,
        discount_value: sale.discountValue,
        discount_reason: sale.discountReason,
        final_amount: sale.finalAmount,
        amount_paid: sale.amountPaid,
        change: sale.change,
        due_amount: sale.dueAmount,
        payment_status: sale.paymentStatus,
        notes: sale.notes
      }).select('id').single();
      
      if (saleErr) {
        console.error('Sale error', saleErr);
        continue;
      }
      if (saleData) {
        idMap.sales[sale.id] = saleData.id;
        
        // SALE ITEMS
        const saleItems = db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(sale.id);
        if (saleItems.length > 0) {
          const insertItems = saleItems.map(item => ({
            sale_id: saleData.id,
            product_id: idMap.products[item.productId] || null,
            product_name: item.productName,
            product_price: item.productPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            discount_type: item.discountType,
            discount_value: item.discountValue,
            discount_reason: item.discountReason,
            notes: item.notes
          }));
          await supabase.from('sale_items').insert(insertItems);
        }
      }
    }

    // SETTINGS
    console.log('Migrating settings...');
    const settings = db.prepare('SELECT * FROM shop_settings WHERE id = 1').get();
    if (settings) {
      await supabase.from('settings').insert({
        workspace_id: workspaceId,
        currency: settings.currency,
        currency_symbol: settings.currencySymbol,
        date_format: settings.dateFormat,
        number_format: settings.numberFormat,
        receipt_size: settings.receiptSize,
        show_logo_receipt: !!settings.showLogoReceipt,
        show_customer_receipt: !!settings.showCustomerReceipt,
        show_tax_breakdown_receipt: !!settings.showTaxBreakdownReceipt,
        show_barcode_receipt: !!settings.showBarcodeReceipt,
        print_automatically: !!settings.printAutomatically,
        low_stock_threshold: settings.lowStockThreshold || 5,
        inventory_valuation_method: settings.inventoryValuationMethod || 'FIFO',
        auto_print_receipt_pos: !!settings.autoPrintReceiptPOS,
        open_cash_drawer: !!settings.openCashDrawer,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        accent_color: settings.accentColor,
        invoice_logo_url: settings.invoiceLogo,
        receipt_header: settings.receiptHeader,
        receipt_footer: settings.receiptFooter
      });
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
  }
}

runMigration();
