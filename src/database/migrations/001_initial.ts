import Database from 'better-sqlite3';

export function initialSchema(db: Database.Database) {
  // The common sync columns appended to most tables
  const syncColumns = `
    workspace_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_status TEXT DEFAULT 'PENDING',
    version INTEGER DEFAULT 1,
    device_id TEXT,
    last_synced_at TEXT
  `;

  // Use a transaction since the runner wraps it, but the SQL script itself contains statements.
  // better-sqlite3 exec() can run multiple statements.
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_urdu TEXT,
      description TEXT,
      ${syncColumns}
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_urdu TEXT,
      category_id TEXT,
      supplier_id TEXT,
      barcode TEXT,
      price REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      initial_stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      description TEXT,
      image TEXT,
      ${syncColumns},
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      pending_amount REAL DEFAULT 0,
      ${syncColumns}
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      ${syncColumns}
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL DEFAULT 0,
      payment_method TEXT,
      reference TEXT,
      notes TEXT,
      vendor TEXT,
      status TEXT,
      ${syncColumns}
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      supplier_id TEXT,
      supplier_name TEXT,
      purchase_date TEXT,
      invoice_number TEXT,
      taxes REAL DEFAULT 0,
      discounts REAL DEFAULT 0,
      notes TEXT,
      total_amount REAL DEFAULT 0,
      ${syncColumns},
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT,
      cost_price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      subtotal REAL DEFAULT 0,
      ${syncColumns},
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      name TEXT,
      name_urdu TEXT,
      address TEXT,
      address_urdu TEXT,
      phone TEXT,
      email TEXT,
      tax_rate REAL DEFAULT 0,
      currency TEXT,
      currency_symbol TEXT,
      ${syncColumns}
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT,
      role TEXT NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'Active',
      ${syncColumns}
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      total REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_amount REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      change REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      payment_method TEXT,
      customer_id TEXT,
      cashier_id TEXT,
      ${syncColumns},
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT,
      product_price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      subtotal REAL DEFAULT 0,
      ${syncColumns},
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      qty_changed INTEGER NOT NULL,
      qty_before INTEGER NOT NULL,
      qty_after INTEGER NOT NULL,
      reference TEXT,
      notes TEXT,
      ${syncColumns},
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Create indexes for performance and sync lookups
    CREATE INDEX IF NOT EXISTS idx_categories_sync_status ON categories(sync_status);
    CREATE INDEX IF NOT EXISTS idx_expenses_sync_status ON expenses(sync_status);
    CREATE INDEX IF NOT EXISTS idx_purchases_sync_status ON purchases(sync_status);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_sync_status ON purchase_items(sync_status);
    CREATE INDEX IF NOT EXISTS idx_users_sync_status ON users(sync_status);

    -- Create indexes for performance and sync lookups
    CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products(sync_status);
    CREATE INDEX IF NOT EXISTS idx_customers_sync_status ON customers(sync_status);
    CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status);
    CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales(sync_status);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sync_status ON sale_items(sync_status);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_sync_status ON inventory_movements(sync_status);
    
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
  `);
}
