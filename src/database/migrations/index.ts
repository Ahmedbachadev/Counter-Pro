import Database from 'better-sqlite3';
import { initialSchema } from './001_initial';

export interface Migration {
  id: number;
  name: string;
  up: (db: Database.Database) => void;
}

import { up as syncQueueUp } from './002_sync_queue';

const migrations: Migration[] = [
  {
    id: 1,
    name: '001_initial_schema',
    up: initialSchema
  },
  {
    id: 2,
    name: '002_sync_queue',
    up: syncQueueUp
  }
];

export function runMigrations(db: Database.Database) {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get executed migrations
  const executedIds = new Set(
    db.prepare('SELECT id FROM _migrations').all().map((row: any) => row.id)
  );

  // Run pending migrations
  const pendingMigrations = migrations.filter((m) => !executedIds.has(m.id));

  if (pendingMigrations.length > 0) {
    console.log(`[Database] Found ${pendingMigrations.length} pending migrations.`);
    
    const insertMigration = db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)');

    // Execute each migration within a transaction
    const executeMigration = db.transaction((migration: Migration) => {
      console.log(`[Database] Running migration: ${migration.name}`);
      migration.up(db);
      insertMigration.run(migration.id, migration.name);
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
