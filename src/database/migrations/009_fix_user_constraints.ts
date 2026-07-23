import Database from 'better-sqlite3';

export function fixUserConstraints(db: Database.Database) {
  // Better-sqlite3 does not support dropping constraints or altering table columns directly
  // We have to create a new table with the correct schema, migrate data, and rename it.

  const syncColumns = `
    workspace_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_status TEXT DEFAULT 'PENDING',
    version INTEGER DEFAULT 1,
    device_id TEXT,
    last_synced_at TEXT
  `;

  db.exec(`
    -- 1. Create a new table with the correct composite UNIQUE constraint
    CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT,
      role TEXT NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'Active',
      ${syncColumns},
      UNIQUE(workspace_id, username)
    );

    -- 2. Copy existing data into the new table
    INSERT INTO users_new (
      id, username, password, role, name, email, phone, status,
      workspace_id, created_at, updated_at, deleted_at, sync_status, version, device_id, last_synced_at
    )
    SELECT 
      id, username, password, role, name, email, phone, status,
      workspace_id, created_at, updated_at, deleted_at, sync_status, version, device_id, last_synced_at
    FROM users;

    -- 3. Drop the old table
    DROP TABLE users;

    -- 4. Rename the new table to the original name
    ALTER TABLE users_new RENAME TO users;

    -- 5. Recreate the sync index
    CREATE INDEX IF NOT EXISTS idx_users_sync_status ON users(sync_status);
  `);
}
