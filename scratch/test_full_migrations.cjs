const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const originalDbPath = path.join(appData, 'khata-book', 'khata_book_local.sqlite');
const tempDbPath = path.join(__dirname, 'khata_book_temp_migrations.sqlite');

console.log('Copying database to:', tempDbPath);
fs.copyFileSync(originalDbPath, tempDbPath);

try {
  console.log('Requiring compiled database layer from public/localdb.cjs');
  const localDbModule = require('../public/localdb.cjs');
  const dbManager = localDbModule.dbManager;

  console.log('Initializing dbManager on temp DB...');
  // Modify appPath to our temp folder so it opens the temp DB
  const tempDir = __dirname;
  
  // To avoid altering the code too much, we will mock app.getPath or override the path.
  // Wait, dbManager.initialize joins userDataPath with 'khata_book_local.sqlite'.
  // So if we pass tempDir, it will create/open khata_book_temp_migrations.sqlite?
  // No, it opens `khata_book_local.sqlite` under that path.
  // Let's create a temporary userData directory.
  const tempUserData = path.join(__dirname, 'temp_user_data');
  if (!fs.existsSync(tempUserData)) {
    fs.mkdirSync(tempUserData);
  }
  
  // Copy original DB to tempUserData/khata_book_local.sqlite
  const targetDbPath = path.join(tempUserData, 'khata_book_local.sqlite');
  fs.copyFileSync(originalDbPath, targetDbPath);
  
  console.log('Opening temp DB at:', targetDbPath);
  dbManager.initialize(tempUserData);
  console.log('Success! Database initialized successfully.');
  
  const columns = dbManager.db.pragma("table_info(products)");
  console.log('Products columns:', columns.map(c => c.name));

  dbManager.close();
  
  // Cleanup tempUserData
  fs.unlinkSync(targetDbPath);
  fs.rmdirSync(tempUserData);
} catch (err) {
  console.error('Failure in full migrations:', err);
}
