import Database from 'better-sqlite3';

export function optimizationSchema(db: Database.Database) {
  // Ensure sku and status columns exist (they may have been added later)
  const columns = db.pragma("table_info(products)") as any[];
  const hasSku = columns.some(col => col.name === 'sku');
  const hasStatus = columns.some(col => col.name === 'status');
  
  if (!hasSku) {
    db.exec(`ALTER TABLE products ADD COLUMN sku TEXT;`);
  }
  if (!hasStatus) {
    db.exec(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'Active';`);
  }

  // Add critical indexes for searches, filters, and relationships
  // These indexes dramatically improve performance on tables with >100,000 rows.
  db.exec(`
    -- Products Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

    -- Customers Indexes
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

    -- Suppliers Indexes
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
    CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at DESC);

    -- Sales Indexes
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

    -- Purchases Indexes
    CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date DESC);

    -- Purchase Items Indexes
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

    -- Expenses Indexes
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
  `);
}
