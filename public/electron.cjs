// public/electron.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Environment check
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development' || !!process.env.ELECTRON_DEV;

// Production-grade logging to a local file
const logPath = path.join(app.getPath('userData'), 'app.log');

function logToFile(...messages) {
  const timestamp = new Date().toISOString();
  const content = `[${timestamp}] ${messages.map(m => {
    if (m instanceof Error) return m.stack || m.message;
    return typeof m === 'object' ? JSON.stringify(m) : m;
  }).join(' ')}\n`;
  try {
    fs.appendFileSync(logPath, content, 'utf8');
  } catch (err) {
    console.error('Failed to write log to file:', err);
  }
  console.log(...messages);
}

// Global Crash/Exception Handling
process.on('uncaughtException', (err) => {
  logToFile('[FATAL] Uncaught Exception:', err);
  dialog.showErrorBox('Fatal Error', `An unexpected error occurred: ${err.message || String(err)}`);
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  logToFile('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

logToFile('Electron started');
logToFile('[App] Starting initialization...');
logToFile('[App] Production path for UserData:', app.getPath('userData'));
logToFile('[App] Log path:', logPath);

let mainWindow;
let db;
let dbManager;
let isDbInitialized = false;

/* -------------------------
   Window State Management
   ------------------------- */
const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

function getSavedWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) {
      const data = JSON.parse(fs.readFileSync(windowStatePath, 'utf8'));
      logToFile('[Window State] Restored saved window state:', data);
      return data;
    }
  } catch (err) {
    logToFile('[Window State] Failed to load window state:', err);
  }
  return { width: 1400, height: 900 }; // defaults
}

function saveWindowState(state) {
  try {
    fs.writeFileSync(windowStatePath, JSON.stringify(state), 'utf8');
  } catch (err) {
    logToFile('[Window State] Failed to save window state:', err);
  }
}

/* -------------------------
   Database initialization
   ------------------------- */
async function initializeDatabase() {
  try {
    logToFile('[DB] Initializing local database...');
    const localDbModule = require('./localdb.cjs');
    dbManager = localDbModule.dbManager;
    dbManager.initialize(app.getPath('userData'));
    db = dbManager.db;
    isDbInitialized = true;
    logToFile('[DB] Local database initialized successfully.');
  } catch (err) {
    logToFile('[FATAL] Failed to initialize local database:', err);
    dialog.showErrorBox(
      'Database Error',
      `Fatal error during database initialization:\n\n${err.stack || err.message || String(err)}`
    );
    app.quit();
    process.exit(1);
  }
}

/* -------------------------
   Window creation
   ------------------------- */
function createWindow() {
  logToFile('[Window] Creating main window...');
  const savedState = getSavedWindowState();

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    resizable: true,
    center: savedState.x === undefined, // Center window if no coordinates saved
    backgroundColor: '#0f172a', // Slate-900 matching the main app background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  const saveStateHelper = () => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    saveWindowState({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  };

  mainWindow.on('resize', saveStateHelper);
  mainWindow.on('move', saveStateHelper);

  const devUrl = 'http://localhost:5173';
  const prodIndex = path.join(__dirname, '../dist/index.html'); // works inside asar

  logToFile('[Window] Preload script path:', path.join(__dirname, 'preload.js'));
  logToFile('[Window] Mode isDev:', isDev);

  if (isDev) {
    logToFile('[Window] Loading dev URL:', devUrl);
    mainWindow.loadURL(devUrl).catch(err => {
      logToFile('[Window] Failed to load dev URL:', err);
    });
  } else {
    logToFile('[Window] Expected production index path:', prodIndex);
    if (fs.existsSync(prodIndex)) {
      logToFile('[Window] Loading production file:', prodIndex);
      mainWindow.loadFile(prodIndex).catch(err => {
        logToFile('[Window] Failed to load production file:', err);
      });
    } else {
      logToFile('[Window] ❌ dist/index.html not found at', prodIndex);
      dialog.showErrorBox(
        'Missing Build',
        'Please run "npm run build" before launching the app.'
      );
      app.quit();
      return;
    }
  }

  mainWindow.once('ready-to-show', () => {
    logToFile('[Window] Window is ready to show.');
    mainWindow.show();
    if (isDev) {
      logToFile('[Window] Opening DevTools for development...');
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    logToFile('[Window] Renderer process crash detected:', details);
  });

  mainWindow.on('unresponsive', () => {
    logToFile('[Window] Main window has become unresponsive.');
  });

  mainWindow.on('closed', () => {
    logToFile('[Window] Main window closed.');
    mainWindow = null;
  });
}

/* -------------------------
   App lifecycle
   ------------------------- */
app.whenReady().then(async () => {
  logToFile('[App] app.whenReady fired.');
  await initializeDatabase();
  logToFile('[App] Database setup complete, creating main window...');
  createWindow();
});

app.on('window-all-closed', () => {
  logToFile('[App] window-all-closed fired.');
  if (process.platform !== 'darwin') {
    if (db) {
      logToFile('[App] Closing database...');
      db.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  logToFile('[App] before-quit fired.');
  if (db) {
    logToFile('[App] Closing database...');
    db.close();
  }
});

/* -------------------------
   IPC handlers
   ------------------------- */
logToFile('IPC ready');

function ensureDB() {
  if (!db) throw new Error('Database not initialized yet');
}

ipcMain.handle('wait-until-db-ready', async () => {
  return isDbInitialized;
});

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
    if (!dbManager) {
      throw new Error('Database manager not available');
    }
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
    logToFile(`[IPC] Error in repo-call ${repoName}.${methodName}:`, error);
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('network-status-change', async (event, status) => {
  logToFile(`[Network] Application is now ${status}`);
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
      logToFile('[DB] query error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      logToFile('[DB] query error:', error);
    }
    return { success: false, error: error.message };
  }
});

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
      logToFile('[DB] transaction error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      logToFile('[DB] transaction error:', error);
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
      logToFile('[DB] run error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      logToFile('[DB] run error:', error);
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
      logToFile('[DB] get error: SQLITE_BUSY (Database is locked, timed out)', error.message);
    } else {
      logToFile('[DB] get error:', error);
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
    logToFile('[Export] Exported data successfully to:', result.filePath);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    logToFile('[Export] Export data error:', error);
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
    logToFile('[Import] Imported data successfully from:', result.filePaths[0]);

    return { success: true };
  } catch (error) {
    logToFile('[Import] Import data error:', error);
    return { success: false, error: error.message };
  }
});