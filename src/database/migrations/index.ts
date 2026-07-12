import Database from 'better-sqlite3';
import { initialSchema } from './001_initial';
import { up as syncQueueSchema } from './002_sync_queue';
import { optimizationSchema } from './003_optimizations';
import { advancedOptimizationSchema } from './004_advanced_optimizations';
import { settingsExpansionSchema } from './005_settings_expansion';

export interface Migration {
  id: number;
  name: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  { id: 1, name: '001_initial', up: initialSchema },
  { id: 2, name: '002_sync_queue', up: syncQueueSchema },
  { id: 3, name: '003_optimizations', up: optimizationSchema },
  { id: 4, name: '004_advanced_optimizations', up: advancedOptimizationSchema },
  { id: 5, name: '005_settings_expansion', up: settingsExpansionSchema },
];

export function runMigrations(db: Database.Database) {
  // Create a table to track migrations if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at TEXT NOT NULL
    );
  `);

  // Get already executed migrations
  const executedStmt = db.prepare('SELECT name FROM schema_migrations');
  const executed = executedStmt.all() as { name: string }[];
  const executedNames = new Set(executed.map((m) => m.name));

  const pendingMigrations = migrations.filter(m => !executedNames.has(m.name));

  if (pendingMigrations.length > 0) {
    console.log(`[Database] Found ${pendingMigrations.length} pending migrations.`);
    
    const insertStmt = db.prepare('INSERT INTO schema_migrations (name, executed_at) VALUES (?, ?)');
    
    // Execute each migration inside a transaction
    const executeMigration = db.transaction((migration: Migration) => {
      console.log(`[Database] Running migration: ${migration.name}`);
      migration.up(db);
      insertStmt.run(migration.name, new Date().toISOString());
    });

    for (const migration of pendingMigrations) {
      try {
        executeMigration(migration);
      } catch (err) {
        console.error(`[Database] Migration failed: ${migration.name}`, err);
        throw err;
      }
    }
    console.log('[Database] Migrations complete.');
  } else {
    console.log('[Database] Database is up to date.');
  }
}
