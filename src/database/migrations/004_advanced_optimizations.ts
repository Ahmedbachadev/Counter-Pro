import Database from 'better-sqlite3';

export function advancedOptimizationSchema(db: Database.Database) {
  // Advanced compound indexes for multi-filter query optimization
  db.exec(`
    -- Product compound indexes
    CREATE INDEX IF NOT EXISTS idx_products_category_supplier ON products(category_id, supplier_id);
    
    -- Sales history compound indexes
    CREATE INDEX IF NOT EXISTS idx_sales_customer_date ON sales(customer_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sales_cashier_date ON sales(cashier_id, created_at DESC);
    
    -- Inventory movements complex lookup
    CREATE INDEX IF NOT EXISTS idx_inventory_product_date ON inventory_movements(product_id, created_at DESC);
    
    -- Optimize status and type lookups
    CREATE INDEX IF NOT EXISTS idx_inventory_action_type ON inventory_movements(action_type);
    CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
  `);
}
