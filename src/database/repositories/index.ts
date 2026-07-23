import Database from 'better-sqlite3';
import { BaseRepository } from './BaseRepository';
import { Product, Customer, Supplier, Sale, SaleItem, InventoryMovement } from '../models';

export class ProductRepository extends BaseRepository<Product> {
  constructor(db: Database.Database) {
    super(db, 'products');
  }

  // Example of domain-specific method
  public findLowStock(): Product[] {
    const wid = this.getCurrentWorkspaceId();
    if (!wid) throw new Error('[Security] Workspace context missing. Access to products denied.');
    const stmt = this.db.prepare('SELECT * FROM products WHERE stock <= min_stock AND deleted_at IS NULL AND workspace_id = ?');
    return stmt.all(wid) as Product[];
  }
}

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(db: Database.Database) {
    super(db, 'customers');
  }
}

export class SupplierRepository extends BaseRepository<Supplier> {
  constructor(db: Database.Database) {
    super(db, 'suppliers');
  }
}

export class SaleRepository extends BaseRepository<Sale> {
  constructor(db: Database.Database) {
    super(db, 'sales');
  }

  // A transaction to create a sale and its items
  public createWithItems(saleData: Partial<Sale> & { workspace_id: string }, items: (Partial<SaleItem> & { workspace_id: string })[]): Sale {
    const transaction = this.db.transaction(() => {
      const sale = this.create(saleData);
      
      const itemRepo = new SaleItemRepository(this.db);
      for (const item of items) {
        item.sale_id = sale.id;
        itemRepo.create(item);
      }
      return sale;
    });

    return transaction();
  }
}

export class SaleItemRepository extends BaseRepository<SaleItem> {
  constructor(db: Database.Database) {
    super(db, 'sale_items');
  }
}

export class InventoryMovementRepository extends BaseRepository<InventoryMovement> {
  constructor(db: Database.Database) {
    super(db, 'inventory_movements');
  }
}

// --- New Repositories ---

export class CategoryRepository extends BaseRepository<any> {
  constructor(db: Database.Database) {
    super(db, 'categories');
  }
}

export class ExpenseRepository extends BaseRepository<any> {
  constructor(db: Database.Database) {
    super(db, 'expenses');
  }
}

export class PurchaseRepository extends BaseRepository<any> {
  constructor(db: Database.Database) {
    super(db, 'purchases');
  }
}

export class PurchaseItemRepository extends BaseRepository<any> {
  constructor(db: Database.Database) {
    super(db, 'purchase_items');
  }
}

export class SettingsRepository extends BaseRepository<any> {
  constructor(db: Database.Database) {
    super(db, 'settings');
  }
}

export class UserRepository extends BaseRepository<any> {
  constructor(db: Database.Database) {
    super(db, 'users');
  }
}

export { BaseRepository };
