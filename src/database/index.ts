import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';
import {
  ProductRepository,
  CustomerRepository,
  SupplierRepository,
  SaleRepository,
  InventoryMovementRepository,
  CategoryRepository,
  ExpenseRepository,
  PurchaseRepository,
  PurchaseItemRepository,
  SettingsRepository,
  UserRepository
} from './repositories';
import { QueueManager } from './sync/QueueManager';
import { SyncEngine } from './sync/engine/SyncEngine';
import { SyncScheduler } from './sync/engine/SyncScheduler';
import { AppEvents } from './sync/AppEvents';

export class DatabaseManager {
  private static instance: DatabaseManager;
  public db!: Database.Database;
  
  public queue!: QueueManager;
  public syncEngine!: SyncEngine;
  public syncScheduler!: SyncScheduler;

  public products!: ProductRepository;
  public customers!: CustomerRepository;
  public suppliers!: SupplierRepository;
  public sales!: SaleRepository;
  public inventory!: InventoryMovementRepository;
  public categories!: CategoryRepository;
  public expenses!: ExpenseRepository;
  public purchases!: PurchaseRepository;
  public purchase_items!: PurchaseItemRepository;
  public settings!: SettingsRepository;
  public users!: UserRepository;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the SQLite connection and run migrations.
   * @param userDataPath The absolute path to Electron's app.getPath('userData')
   */
  public initialize(userDataPath: string): void {
    if (this.db) {
      console.warn('[DatabaseManager] Database already initialized.');
      return;
    }

    const dbPath = path.join(userDataPath, 'khata_book_local.sqlite');
    console.log(`[DatabaseManager] Initializing database at ${dbPath}`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    this.db = new Database(dbPath, { 
      // verbose: console.log 
    });
    
    // Enable WAL mode for performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('mmap_size = 268435456'); // 256MB mmap
    this.db.pragma('temp_store = MEMORY');
    
    // Run all pending migrations
    runMigrations(this.db);

    // Initialize Queue Manager
    this.queue = new QueueManager(this.db);
    this.queue.recover();

    // Initialize Sync Engine & Scheduler
    this.syncEngine = new SyncEngine(this.db, this.queue);
    this.syncScheduler = new SyncScheduler(this.syncEngine, this.queue);
    
    // Auto-start sync scheduler (Assuming workspace '1' for now, could be dynamic)
    this.syncScheduler.initialize('1', true);

    // Initialize repositories
    this.products = new ProductRepository(this.db);
    this.customers = new CustomerRepository(this.db);
    this.suppliers = new SupplierRepository(this.db);
    this.sales = new SaleRepository(this.db);
    this.inventory = new InventoryMovementRepository(this.db);
    this.categories = new CategoryRepository(this.db);
    this.expenses = new ExpenseRepository(this.db);
    this.purchases = new PurchaseRepository(this.db);
    this.purchase_items = new PurchaseItemRepository(this.db);
    this.settings = new SettingsRepository(this.db);
    this.users = new UserRepository(this.db);

    console.log('[DatabaseManager] Database initialization complete.');
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      console.log('[DatabaseManager] Database connection closed.');
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();
