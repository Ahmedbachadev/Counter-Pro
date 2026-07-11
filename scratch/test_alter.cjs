const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const originalDbPath = path.join(appData, 'khata-book', 'khata_book_local.sqlite');
const tempDbPath = path.join(__dirname, 'khata_book_temp.sqlite');

console.log('Copying database to:', tempDbPath);
fs.copyFileSync(originalDbPath, tempDbPath);

try {
  const db = new Database(tempDbPath);
  
  console.log('--- Before migrations ---');
  let columns = db.pragma("table_info(products)");
  console.log('Columns in products:', columns.map(c => c.name));

  const hasSku = columns.some(c => c.name === 'sku');
  const hasStatus = columns.some(c => c.name === 'status');

  console.log('hasSku:', hasSku, 'hasStatus:', hasStatus);

  if (!hasSku) {
    console.log('Running ADD COLUMN sku');
    db.exec(`ALTER TABLE products ADD COLUMN sku TEXT;`);
    columns = db.pragma("table_info(products)");
    console.log('Columns after sku:', columns.map(c => c.name));
  }

  if (!hasStatus) {
    console.log('Running ADD COLUMN status');
    db.exec(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'Active';`);
    columns = db.pragma("table_info(products)");
    console.log('Columns after status:', columns.map(c => c.name));
  }

  console.log('Running index creations...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
  `);
  console.log('Success!');

  db.close();
} catch (err) {
  console.error('Failure:', err);
} finally {
  if (fs.existsSync(tempDbPath)) {
    fs.unlinkSync(tempDbPath);
  }
}
