import Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  // SyncQueue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      device_id TEXT NOT NULL,
      version INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_workspace ON sync_queue(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_record ON sync_queue(record_id);
  `);
}

export function down(db: Database.Database): void {
  db.exec('DROP TABLE IF EXISTS sync_queue;');
}
