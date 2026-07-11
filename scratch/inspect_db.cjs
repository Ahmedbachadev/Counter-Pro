const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(
  process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'),
  'khata-book',
  'khata_book_local.sqlite'
);

console.log('Opening database at:', dbPath);
try {
  const db = new Database(dbPath);
  const columns = db.pragma("table_info(products)");
  console.log('Columns in products table:', columns.map(c => c.name));
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables in database:', tables.map(t => t.name));

  const schema_migrations = db.prepare("SELECT * FROM schema_migrations").all();
  console.log('Executed migrations:', schema_migrations);

  db.close();
} catch (err) {
  console.error('Error opening db:', err);
}
