import Database from 'better-sqlite3';
import { mainSupabase } from './MainSupabaseClient';
import { ProgressManager } from './ProgressManager';
import { SyncLogger } from './SyncLogger';
import { ConflictDetector } from './ConflictDetector';
import { now } from '../../utils/dbUtils';

export class DownloadManager {
  private db: Database.Database;
  private progress: ProgressManager;
  private conflictDetector: ConflictDetector;

  // List of tables that participate in sync
  private readonly SYNC_TABLES = [
    'categories', 'products', 'customers', 'suppliers', 
    'expenses', 'purchases', 'purchase_items', 'settings'
  ];

  constructor(db: Database.Database, progress: ProgressManager, conflictDetector: ConflictDetector) {
    this.db = db;
    this.progress = progress;
    this.conflictDetector = conflictDetector;
  }

  public async downloadChanges(workspaceId: string): Promise<boolean> {
    if (!mainSupabase) {
      SyncLogger.error('Supabase client is not initialized in Main Process');
      return false;
    }

    this.progress.setStage('downloading', 'Downloading remote changes');
    let allSuccessful = true;

    for (const tableName of this.SYNC_TABLES) {
      this.progress.setModule(tableName);

      try {
        // 1. Get the last synced timestamp for this workspace and table
        const lastSyncedRow = this.db.prepare(`
          SELECT MAX(last_synced_at) as last_sync 
          FROM ${tableName} 
          WHERE workspace_id = ?
        `).get(workspaceId) as { last_sync: string | null };

        const lastSync = lastSyncedRow?.last_sync || '1970-01-01T00:00:00.000Z';

        // 2. Fetch incrementally from cloud
        const { data: cloudRecords, error } = await mainSupabase
          .from(tableName)
          .select('*')
          .eq('workspace_id', workspaceId)
          .gt('updated_at', lastSync)
          .order('updated_at', { ascending: true });

        if (error) throw error;
        if (!cloudRecords || cloudRecords.length === 0) continue;

        SyncLogger.info(`Downloaded ${cloudRecords.length} records for ${tableName}`);

        // 3. Apply changes with conflict detection
        const transaction = this.db.transaction(() => {
          for (const cloudRecord of cloudRecords) {
            const resolution = this.conflictDetector.evaluate(tableName, cloudRecord);

            if (resolution === 'cloud_wins') {
              // Upsert the cloud record into SQLite
              const keys = Object.keys(cloudRecord);
              
              // We ensure sync_status is synced and last_synced_at is now
              cloudRecord.sync_status = 'synced';
              cloudRecord.last_synced_at = now();

              const placeholders = keys.map(() => '?').join(', ');
              const updates = keys.map(k => `${k} = excluded.${k}`).join(', ');

              const query = `
                INSERT INTO ${tableName} (${keys.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT(id) DO UPDATE SET ${updates}
              `;
              
              const values = keys.map(k => cloudRecord[k]);
              this.db.prepare(query).run(values);
            }
          }
        });

        transaction();
        this.progress.addDownload(cloudRecords.length);

      } catch (err) {
        SyncLogger.error(`Download failed for ${tableName}`, err);
        allSuccessful = false;
        this.progress.addFailure();
      }
    }

    return allSuccessful;
  }
}
