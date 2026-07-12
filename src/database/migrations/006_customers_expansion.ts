import Database from 'better-sqlite3';

export function customersExpansionSchema(db: Database.Database) {
  const columnsToAdd = [
    { name: 'loyalty_points', type: 'INTEGER DEFAULT 0' },
    { name: 'customer_type', type: 'TEXT' },
    { name: 'billing_address', type: 'TEXT' },
    { name: 'shipping_address', type: 'TEXT' },
    { name: 'notes', type: 'TEXT' },
    { name: 'status', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      db.exec(`ALTER TABLE customers ADD COLUMN ${col.name} ${col.type}`);
    } catch (err: any) {
      if (!err.message.includes('duplicate column name')) {
        throw err;
      }
    }
  }
}
