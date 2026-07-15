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
import { InitialSyncManager } from './sync/engine/InitialSyncManager';
import { setSupabaseSession, clearSupabaseSession } from './sync/engine/MainSupabaseClient';
import { AppEvents } from './sync/AppEvents';

export class DatabaseManager {
  private static instance: DatabaseManager;
  public db!: Database.Database;
  
  public queue!: QueueManager;
  public syncEngine!: SyncEngine;
  public syncScheduler!: SyncScheduler;
  public initialSyncManager!: InitialSyncManager;

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

  private currentWorkspaceId: string | null = null;

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

    // Initialize Sync Engine & Scheduler (but do NOT start yet — wait for workspace ID)
    this.syncEngine = new SyncEngine(this.db, this.queue);
    this.syncScheduler = new SyncScheduler(this.syncEngine, this.queue);
    this.initialSyncManager = new InitialSyncManager(this.db);

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

    console.log('[DatabaseManager] Database initialization complete (sync not started — waiting for workspace).');
  }

  /**
   * Set the Supabase auth session in the main process so the sync engine 
   * can make authenticated API calls.
   */
  public async setAuthSession(accessToken: string, refreshToken: string): Promise<boolean> {
    return setSupabaseSession(accessToken, refreshToken);
  }

  /**
   * Initialize sync for a specific workspace.
   * Called after login when we know the workspace ID and have auth tokens.
   * 
   * Steps:
   * 1. Check if initial sync is needed (first login on this device)
   * 2. If yes, perform full download from Supabase
   * 3. Start the sync scheduler for incremental sync
   */
  public async initializeSync(workspaceId: string): Promise<void> {
    this.currentWorkspaceId = workspaceId;
    console.log(`[DatabaseManager] Initializing sync for workspace ${workspaceId}`);

    // Check if initial sync is needed
    const needsInitialSync = !this.initialSyncManager.isInitialSyncCompleted(workspaceId);

    if (needsInitialSync) {
      console.log('[DatabaseManager] First login on this device — performing initial sync...');
      await this.initialSyncManager.performInitialSync(workspaceId);
    }

    // Start the sync scheduler for incremental background sync
    this.syncScheduler.initialize(workspaceId, true);
    console.log(`[DatabaseManager] Sync scheduler started for workspace ${workspaceId}`);
  }

  /**
   * Trigger a manual sync cycle.
   */
  public requestManualSync(): void {
    if (this.syncScheduler) {
      this.syncScheduler.requestManualSync();
    }
  }

  /**
   * Stop sync and clear session (e.g., on logout).
   */
  public async stopSync(): Promise<void> {
    if (this.syncScheduler) {
      this.syncScheduler.stop();
    }
    this.currentWorkspaceId = null;
    await clearSupabaseSession();
    console.log('[DatabaseManager] Sync stopped and session cleared.');
  }

  /**
   * Get current sync status information.
   */
  public getSyncStatus(): { 
    workspaceId: string | null; 
    isSyncing: boolean; 
    initialSyncCompleted: boolean;
    queueStats: { pending: number; syncing: number; failed: number };
  } {
    const initialSyncCompleted = this.currentWorkspaceId 
      ? this.initialSyncManager.isInitialSyncCompleted(this.currentWorkspaceId)
      : false;

    const queueStats = this.currentWorkspaceId
      ? this.queue.getQueueStats(this.currentWorkspaceId)
      : { pending: 0, syncing: 0, failed: 0 };

    return {
      workspaceId: this.currentWorkspaceId,
      isSyncing: this.syncEngine.isRunning,
      initialSyncCompleted,
      queueStats
    };
  }

  public close(): void {
    if (this.syncScheduler) {
      this.syncScheduler.stop();
    }
    if (this.db) {
      this.db.close();
      console.log('[DatabaseManager] Database connection closed.');
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();
