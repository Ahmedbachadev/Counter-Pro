// public/electron.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !!process.env.ELECTRON_DEV;

let mainWindow;
let db;
/* -------------------------
   Database initialization
   ------------------------- */
async function initializeDatabase() {
  try {
    const { dbManager } = require('./localdb.cjs');
    dbManager.initialize(app.getPath('userData'));
    db = dbManager.db;
  } catch (err) {
    console.error('Failed to initialize local database:', err);
  }
}

/* -------------------------
   Table creation
   ------------------------- */
function createTables() {}

/* -------------------------
   Default data
   ------------------------- */
function insertDefaultData() {}

/* -------------------------
   Window creation
   ------------------------- */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });
  const devUrl = 'http://localhost:5173';
  const prodIndex = path.join(__dirname, '../dist/index.html'); // ✅ works inside asar

  if (isDev) {
    console.log('[electron] Loading dev URL:', devUrl);
    mainWindow.loadURL(devUrl).catch(console.error);
  } else {
    if (fs.existsSync(prodIndex)) {
      console.log('[electron] Loading production file:', prodIndex);
      mainWindow.loadFile(prodIndex).catch(console.error);
    } else {
      console.error('❌ dist/index.html not found at', prodIndex);
      dialog.showErrorBox(
        'Missing Build',
        'Please run "npm run build" before launching the app.'
      );
      app.quit();
      return;
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });
  mainWindow.on('closed', () => (mainWindow = null));
}

/* -------------------------
   App lifecycle
   ------------------------- */
app.whenReady().then(async () => {
  await initializeDatabase();
  console.log('✅ Database ready, now creating window...');
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});
app.on('before-quit', () => {
  if (db) db.close();
});

/* -------------------------
   IPC handlers
   ------------------------- */
function ensureDB() {
  if (!db) throw new Error('Database not initialized yet');
}

// Helper function to wrap database operations with timeout
async function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
}

ipcMain.handle('repo-call', async (event, repoName, methodName, ...args) => {
  try {
    ensureDB();
    const { dbManager } = require('./localdb.cjs');
    const repo = dbManager[repoName];
    if (!repo) {
      throw new Error(`Repository not found: ${repoName}`);
    }
    if (typeof repo[methodName] !== 'function') {
      throw new Error(`Method ${methodName} not found on ${repoName}`);
    }
    const result = await repo[methodName](...args);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error in repo-call ${repoName}.${methodName}:`, error);
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('network-status-change', async (event, status) => {
  console.log(`[Network] Application is now ${status}`);
  if (dbManager?.syncScheduler) {
    dbManager.syncScheduler.setNetworkStatus(status === 'online');
  }
  return { success: true };
});

ipcMain.handle('db-query', async (event, sql, params = []) => {
  try {
    ensureDB();
    const operation = new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const data = stmt.all(params);
        resolve({ success: true, data });
      } catch (err) {
        reject(err);
      }
    });

    return await withTimeout(operation, 8000);
  } catch (error) {
    if (error.code === 'SQLITE_BUSY') {
      console.error('Database query error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      console.error('Database query error:', error);
    }
    return { success: false, error: error.message };
  }
});

// Added a general transaction handler to wrap complex, multi-step DB calls
// This is not used by your current TS file, but is a best practice.
ipcMain.handle('db-transaction', async (event, operations) => {
    try {
        ensureDB();
        const transaction = db.transaction(() => {
            const results = [];
            for (const { sql, params } of operations) {
                const stmt = db.prepare(sql);
                const result = stmt.run(params);
                results.push(result);
            }
            return results;
        });
        return { success: true, data: transaction() };
    } catch (error) {
        if (error.code === 'SQLITE_BUSY') {
            console.error('Database transaction error: SQLITE_BUSY (Database is locked, timed out)', error.message);
        } else {
            console.error('Database transaction error:', error);
        }
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-run', async (event, sql, params = []) => {
  try {
    ensureDB();
    const operation = new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const data = stmt.run(params);
        resolve({ success: true, data });
      } catch (err) {
        reject(err);
      }
    });

    return await withTimeout(operation, 8000);
  } catch (error) {
    if (error.code === 'SQLITE_BUSY') {
      console.error('Database run error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      console.error('Database run error:', error);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-get', async (event, sql, params = []) => {
  try {
    ensureDB();
    const operation = new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const data = stmt.get(params);
        resolve({ success: true, data });
      } catch (err) {
        reject(err);
      }
    });

    return await withTimeout(operation, 8000);
  } catch (error) {
    if (error.code === 'SQLITE_BUSY') {
      console.error('Database get error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      console.error('Database get error:', error);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-data', async () => {
  try {
    ensureDB();

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Database',
      defaultPath: `sanishop-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' };
    }

    const data = {
      categories: db.prepare('SELECT * FROM categories').all(),
      suppliers: db.prepare('SELECT * FROM suppliers').all(),
      products: db.prepare('SELECT * FROM products').all(),
      customers: db.prepare('SELECT * FROM customers').all(),
      sales: db.prepare('SELECT * FROM sales').all(),
      sale_items: db.prepare('SELECT * FROM sale_items').all(),
      stock_purchases: db.prepare('SELECT * FROM stock_purchases').all(),
      settings: db.prepare('SELECT * FROM settings').all(),
      users: db.prepare('SELECT * FROM users').all(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');

    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Export data error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-data', async () => {
  try {
    ensureDB();

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Database',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, error: 'Import cancelled' };
    }

    const fileContent = fs.readFileSync(result.filePaths[0], 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.version) {
      return { success: false, error: 'Invalid backup file format' };
    }

    const importTransaction = db.transaction(() => {
      db.prepare('DELETE FROM sale_items').run();
      db.prepare('DELETE FROM sales').run();
      db.prepare('DELETE FROM stock_purchases').run();
      db.prepare('DELETE FROM products').run();
      db.prepare('DELETE FROM customers').run();
      db.prepare('DELETE FROM suppliers').run();
      db.prepare('DELETE FROM categories').run();
      db.prepare('DELETE FROM users WHERE id > 1').run();
      db.prepare('DELETE FROM settings WHERE id > 1').run();

      if (data.categories && data.categories.length > 0) {
        const insertCategory = db.prepare(
          'INSERT INTO categories (id, name, nameUrdu, description, createdAt) VALUES (?, ?, ?, ?, ?)'
        );
        data.categories.forEach(cat => {
          insertCategory.run(cat.id, cat.name, cat.nameUrdu, cat.description, cat.createdAt);
        });
      }

      if (data.suppliers && data.suppliers.length > 0) {
        const insertSupplier = db.prepare(
          'INSERT INTO suppliers (id, name, contactPerson, phone, email, address, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        data.suppliers.forEach(sup => {
          insertSupplier.run(sup.id, sup.name, sup.contactPerson, sup.phone, sup.email, sup.address, sup.notes, sup.createdAt, sup.updatedAt);
        });
      }

      if (data.products && data.products.length > 0) {
        const insertProduct = db.prepare(
          'INSERT INTO products (id, name, nameUrdu, categoryId, supplierId, barcode, price, cost, stock, initialStock, minStock, description, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        data.products.forEach(prod => {
          insertProduct.run(
            prod.id, prod.name, prod.nameUrdu, prod.categoryId, prod.supplierId, prod.barcode,
            prod.price, prod.cost, prod.stock, prod.initialStock, prod.minStock,
            prod.description, prod.image, prod.createdAt, prod.updatedAt
          );
        });
      }

      if (data.customers && data.customers.length > 0) {
        const insertCustomer = db.prepare(
          'INSERT INTO customers (id, name, phone, email, address, pendingAmount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        data.customers.forEach(cust => {
          insertCustomer.run(cust.id, cust.name, cust.phone, cust.email, cust.address, cust.pendingAmount, cust.createdAt);
        });
      }

      if (data.sales && data.sales.length > 0) {
        const insertSale = db.prepare(
          'INSERT INTO sales (id, total, tax, discount, finalAmount, amountPaid, change, dueAmount, paymentMethod, customerId, cashierId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        data.sales.forEach(sale => {
          insertSale.run(
            sale.id, sale.total, sale.tax, sale.discount, sale.finalAmount,
            sale.amountPaid, sale.change, sale.dueAmount, sale.paymentMethod,
            sale.customerId, sale.cashierId, sale.createdAt
          );
        });
      }

      if (data.sale_items && data.sale_items.length > 0) {
        const insertSaleItem = db.prepare(
          'INSERT INTO sale_items (id, saleId, productId, productName, productPrice, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        data.sale_items.forEach(item => {
          insertSaleItem.run(item.id, item.saleId, item.productId, item.productName, item.productPrice, item.quantity, item.subtotal);
        });
      }

      if (data.stock_purchases && data.stock_purchases.length > 0) {
        const insertPurchase = db.prepare(
          'INSERT INTO stock_purchases (id, productId, productName, supplierId, supplierName, quantity, costPrice, totalCost, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        data.stock_purchases.forEach(purchase => {
          insertPurchase.run(
            purchase.id, purchase.productId, purchase.productName, purchase.supplierId,
            purchase.supplierName, purchase.quantity, purchase.costPrice, purchase.totalCost, purchase.createdAt
          );
        });
      }

      if (data.settings && data.settings.length > 0) {
        const updateSettings = db.prepare(
          'UPDATE settings SET name = ?, nameUrdu = ?, address = ?, addressUrdu = ?, phone = ?, email = ?, taxRate = ?, updatedAt = ? WHERE id = 1'
        );
        const settings = data.settings[0];
        updateSettings.run(
          settings.name, settings.nameUrdu, settings.address, settings.addressUrdu,
          settings.phone, settings.email, settings.taxRate, settings.updatedAt
        );
      }

      if (data.users && data.users.length > 1) {
        const insertUser = db.prepare(
          'INSERT INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)'
        );
        data.users.slice(1).forEach(user => {
          insertUser.run(user.id, user.username, user.password, user.role, user.createdAt);
        });
      }
    });

    importTransaction();

    return { success: true };
  } catch (error) {
    console.error('Import data error:', error);
    return { success: false, error: error.message };
  }
});