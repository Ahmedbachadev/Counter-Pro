const fs = require('fs');
let content = fs.readFileSync('public/electron.js', 'utf8');

// Remove require('better-sqlite3')
content = content.replace(/const Database = require\('better-sqlite3'\);\n/, '');

// Replace initializeDatabase body with just a log or empty
content = content.replace(/function initializeDatabase\(\) \{[\s\S]*?\n\}/, "function initializeDatabase() { console.log('Database runs on Supabase now.'); }");

// Remove createTables and insertDefaultData (or empty them)
content = content.replace(/function createTables\(\) \{[\s\S]*?\n\}/, "function createTables() {}");
content = content.replace(/function insertDefaultData\(\) \{[\s\S]*?\n\}/, "function insertDefaultData() {}");

// Replace IPC handlers for database
content = content.replace(/ipcMain\.handle\('db:query'[\s\S]*?\n\}\);/g, "ipcMain.handle('db:query', () => { throw new Error('SQLite removed. Use Supabase instead.'); });");

fs.writeFileSync('public/electron.js', content);
