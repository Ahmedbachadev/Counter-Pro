import Database from 'better-sqlite3';
import { mainSupabase } from './MainSupabaseClient';
import { ProgressManager } from './ProgressManager';
import { SyncLogger } from './SyncLogger';
import { ConflictDetector } from './ConflictDetector';
import { now } from '../../utils/dbUtils';
import { AppEvents } from '../AppEvents';
import { TABLE_MAPPINGS } from './TableMapping';

export class DownloadManager {
  private db: Database.Database;
  private progress: ProgressManager;
  private conflictDetector: ConflictDetector;

  // Complete list of tables that participate in sync — matches InitialSyncManager
  // Ordered by dependencies (e.g. settings/users first, categories before products, products before purchases, etc.)
  private readonly SYNC_TABLES = [
    'settings', 'users', 'categories', 'suppliers', 'customers',
    'products', 'purchases', 'purchase_items', 'sales', 'sale_items',
    'inventory_movements', 'expenses'
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
    const updatedTables: string[] = [];

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

        const mapping = TABLE_MAPPINGS[tableName] || { remoteTable: tableName, workspaceFiltered: true };
        const selectStr = mapping.parentJoin ? `*, ${mapping.parentJoin}` : '*';
        const syncCol = mapping.syncColumn || 'updated_at';

        let from = 0;
        const batchSize = 1000;
        let hasMore = true;
        let tableDownloadedCount = 0;

        while (hasMore) {
          // 2. Fetch incrementally from cloud with pagination
          let query = mainSupabase
            .from(mapping.remoteTable)
            .select(selectStr)
            .gt(syncCol, lastSync)
            .order(syncCol, { ascending: true })
            .range(from, from + batchSize - 1);
            
          if (mapping.workspaceFiltered) {
            query = query.eq('workspace_id', workspaceId);
          } else if (mapping.parentJoin) {
            const parentTable = mapping.parentJoin.split('!')[0];
            query = query.eq(`${parentTable}.workspace_id`, workspaceId);
          }

          const { data: cloudRecords, error } = await query;

          if (error) throw error;
          
          if (!cloudRecords || cloudRecords.length === 0) {
            hasMore = false;
            break;
          }

          // Fetch valid columns for this table dynamically
          const columnsInfo = this.db.pragma(`table_info(${tableName})`) as any[];
          const validColumns = new Set(columnsInfo.map((c: any) => c.name));

          // 3. Apply changes with conflict detection in a transaction
          const transaction = this.db.transaction(() => {
            for (const cloudRecord of cloudRecords) {
              const resolution = this.conflictDetector.evaluate(tableName, cloudRecord);

              if (resolution === 'cloud_wins') {
                // Upsert the cloud record into SQLite
                
                // We ensure sync_status is synced and last_synced_at is now
                cloudRecord.sync_status = 'synced';
                cloudRecord.last_synced_at = now();
                
                // SQLite requires updated_at and workspace_id, but some child tables in Supabase lack them
                if (!cloudRecord.workspace_id) cloudRecord.workspace_id = workspaceId;
                if (!cloudRecord.updated_at) cloudRecord.updated_at = cloudRecord.created_at || now();
                if (!cloudRecord.created_at) cloudRecord.created_at = now();

                // Filter keys to prevent "no such column" errors
                const validKeys = Object.keys(cloudRecord).filter(k => validColumns.has(k));
                if (validKeys.length === 0) continue;

                const placeholders = validKeys.map(() => '?').join(', ');
                const updates = validKeys.map(k => `${k} = excluded.${k}`).join(', ');

                const query = `
                  INSERT INTO ${tableName} (${validKeys.join(', ')})
                  VALUES (${placeholders})
                  ON CONFLICT(id) DO UPDATE SET ${updates}
                `;
                
                const values = validKeys.map(k => {
                  if (typeof cloudRecord[k] === 'boolean') return cloudRecord[k] ? 1 : 0;
                  if (typeof cloudRecord[k] === 'object' && cloudRecord[k] !== null) return JSON.stringify(cloudRecord[k]);
                  return cloudRecord[k];
                });
                try {
                  this.db.prepare(query).run(values);
                } catch (insertErr: any) {
                  throw new Error(JSON.stringify({
                    error: "SQLITE_INSERT_FAILED",
                    message: insertErr.message,
                    table: tableName,
                    query: query.trim(),
                    values: validKeys.reduce((acc, key, i) => ({ ...acc, [key]: values[i] }), {})
                  }, null, 2));
                }
              }
            }
          });

          transaction();
          
          tableDownloadedCount += cloudRecords.length;
          from += batchSize;
          
          if (cloudRecords.length < batchSize) {
            hasMore = false;
          }
        }

        if (tableDownloadedCount > 0) {
          SyncLogger.info(`Downloaded ${tableDownloadedCount} records for ${tableName}`);
          this.progress.addDownload(tableDownloadedCount);
          updatedTables.push(tableName);
        }

      } catch (err) {
        SyncLogger.error(`Download failed for ${tableName}`, err);
        allSuccessful = false;
        this.progress.addFailure();
      }
    }

    // Notify the renderer which tables were updated so it can refresh stores
    if (updatedTables.length > 0) {
      AppEvents.broadcastToRenderers('sync:data-updated', updatedTables);
      SyncLogger.info(`Data updated in tables: ${updatedTables.join(', ')}`);
    }

    return allSuccessful;
  }
}
