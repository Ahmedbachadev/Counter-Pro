const db = require('better-sqlite3')('C:/Users/Decent/AppData/Roaming/Counter Pro/khata_book_local.sqlite');
console.log(db.prepare("SELECT * FROM sync_queue WHERE table_name = 'settings' LIMIT 2").all());
