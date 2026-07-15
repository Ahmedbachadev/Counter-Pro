import Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  db.exec(`
    -- Track sync state per workspace
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL UNIQUE,
      initial_sync_completed INTEGER DEFAULT 0,
      initial_sync_at TEXT,
      last_full_sync_at TEXT,
      tables_synced TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sync_metadata_workspace ON sync_metadata(workspace_id);
  `);
}

export function down(db: Database.Database): void {
  db.exec('DROP TABLE IF EXISTS sync_metadata;');
}
