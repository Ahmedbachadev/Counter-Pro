import Database from 'better-sqlite3';

export function businessProfileSchema(db: Database.Database) {
  // Add missing explicit Business Profile columns
  const newColumns = [
    'owner_name',
    'whatsapp_number',
    'city',
    'country',
    'registration_number',
    'preferences' // Fallback JSON column for any unmapped UI fields
  ];

  const columnsInfo = db.pragma("table_info(settings)") as any[];
  const existingColumns = new Set(columnsInfo.map(c => c.name));

  for (const col of newColumns) {
    if (!existingColumns.has(col)) {
      db.exec(`ALTER TABLE settings ADD COLUMN ${col} TEXT;`);
    }
  }
}
