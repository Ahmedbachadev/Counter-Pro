import Database from 'better-sqlite3';
import { mainSupabase } from './MainSupabaseClient';
import { SyncLogger } from './SyncLogger';
import { now } from '../../utils/dbUtils';
import { AppEvents } from '../AppEvents';
import { TABLE_MAPPINGS } from './TableMapping';

/**
 * InitialSyncManager handles the first-time full download of all workspace data
 * from Supabase into the local SQLite cache.
 * 
 * This runs when a workspace logs into a device for the first time (no local data exists).
 */
export class InitialSyncManager {
  private db: Database.Database;

  // Complete list of all business tables to sync
  private readonly ALL_TABLES = [
    'categories',
    'products', 
    'customers',
    'suppliers',
    'expenses',
    'purchases',
    'purchase_items',
    'sales',
    'sale_items',
    'inventory_movements',
    'settings',
    'users',
  ];

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Check if initial sync has been completed for a workspace.
   */
  public isInitialSyncCompleted(workspaceId: string): boolean {
    const row = this.db.prepare(
      'SELECT initial_sync_completed FROM sync_metadata WHERE workspace_id = ?'
    ).get(workspaceId) as { initial_sync_completed: number } | undefined;

    if (row?.initial_sync_completed === 1) {
      // Auto-Recovery: Verify if the database is actually empty (e.g. users table)
      // If it's empty but initial_sync is 1, reset it so sync runs again.
      try {
        const usersCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        if (usersCount.count === 0) {
          SyncLogger.warn('[InitialSync] DB is empty but initial_sync_completed is 1. Forcing auto-recovery...');
          this.db.prepare('UPDATE sync_metadata SET initial_sync_completed = 0 WHERE workspace_id = ?').run(workspaceId);
          return false;
        }
      } catch (err) {
        // Table might not exist yet, treat as empty
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Perform a full initial download of all workspace data from Supabase.
   * This is called once per workspace per device.
   */
  public async performInitialSync(workspaceId: string): Promise<boolean> {
    if (!mainSupabase) {
      SyncLogger.error('[InitialSync] Supabase client not initialized');
      return false;
    }

    if (this.isInitialSyncCompleted(workspaceId)) {
      SyncLogger.info('[InitialSync] Already completed for workspace ' + workspaceId);
      return true;
    }

    SyncLogger.info(`[InitialSync] Starting full download for workspace ${workspaceId}...`);
    AppEvents.broadcastToRenderers('sync:initial-start', { workspaceId });

    let totalDownloaded = 0;
    const tablesSynced: string[] = [];
    let allSuccessful = true;

    for (const tableName of this.ALL_TABLES) {
      try {
        SyncLogger.info(`[InitialSync] Downloading ${tableName}...`);
        AppEvents.broadcastToRenderers('sync:initial-progress', {
          table: tableName,
          totalDownloaded,
          tablesCompleted: tablesSynced.length,
          totalTables: this.ALL_TABLES.length
        });

        const mapping = TABLE_MAPPINGS[tableName] || { remoteTable: tableName, workspaceFiltered: true };
        const selectStr = mapping.parentJoin ? `*, ${mapping.parentJoin}` : '*';

        // Fetch ALL records for this workspace from Supabase
        let allRecords: any[] = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
          let query = mainSupabase
            .from(mapping.remoteTable)
            .select(selectStr)
            .range(from, from + batchSize - 1)
            .order('created_at', { ascending: true });

          if (mapping.workspaceFiltered) {
            query = query.eq('workspace_id', workspaceId);
          } else if (mapping.parentJoin) {
            const parentTable = mapping.parentJoin.split('!')[0];
            query = query.eq(`${parentTable}.workspace_id`, workspaceId);
          }

          const { data, error } = await query;

          if (error) {
            SyncLogger.error(`[InitialSync] Failed to fetch ${tableName}: ${error.message}`);
            throw error;
          }

          if (!data || data.length === 0) break;
          allRecords = allRecords.concat(data);
          from += batchSize;

          // If we got less than batchSize, we've reached the end
          if (data.length < batchSize) break;
        }

        if (allRecords.length === 0) {
          SyncLogger.info(`[InitialSync] No records for ${tableName}`);
          tablesSynced.push(tableName);
          continue;
        }

        SyncLogger.info(`[InitialSync] Downloaded ${allRecords.length} records for ${tableName}`);

        // Fetch valid columns for this table dynamically to prevent schema mismatch crashes
        const columnsInfo = this.db.pragma(`table_info(${tableName})`) as any[];
        const validColumns = new Set(columnsInfo.map((c: any) => c.name));

        let insertedCount = 0;
        let skippedCount = 0;

        // Insert all records into SQLite in a transaction
        this.db.transaction(() => {
          for (const record of allRecords) {
            // Add sync tracking columns
            record.sync_status = 'synced';
            record.last_synced_at = now();
            if (!record.version) record.version = 1;
            if (!record.device_id) record.device_id = 'CLOUD';

            // SQLite requires updated_at and workspace_id, but some child tables in Supabase lack them
            if (!record.workspace_id) record.workspace_id = workspaceId;
            if (!record.updated_at) record.updated_at = record.created_at || now();
            if (!record.created_at) record.created_at = now();

            // Filter to only valid columns
            const validKeys = Object.keys(record).filter(k => validColumns.has(k));
            
            if (validKeys.length === 0) {
               skippedCount++;
               continue;
            }

            const placeholders = validKeys.map(() => '?').join(', ');
            const updates = validKeys.map(k => `${k} = excluded.${k}`).join(', ');
            const values = validKeys.map(k => {
              if (typeof record[k] === 'boolean') return record[k] ? 1 : 0;
              if (typeof record[k] === 'object' && record[k] !== null) return JSON.stringify(record[k]);
              return record[k];
            });

            try {
              this.db.prepare(`
                INSERT INTO ${tableName} (${validKeys.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT(id) DO UPDATE SET ${updates}
              `).run(values);
              insertedCount++;
            } catch (insertErr: any) {
              throw new Error(JSON.stringify({
                error: "SQLITE_INSERT_FAILED",
                message: insertErr.message,
                table: tableName,
                query: `INSERT INTO ${tableName} (${validKeys.join(', ')}) ...`,
                values: validKeys.reduce((acc, key, i) => ({ ...acc, [key]: values[i] }), {})
              }, null, 2));
            }
          }
        })();

        SyncLogger.info(`[InitialSync] Finished ${tableName}: ${insertedCount} inserted, ${skippedCount} skipped.`);

        totalDownloaded += insertedCount; // Only count successfully inserted
        tablesSynced.push(tableName);

      } catch (err: any) {
        SyncLogger.error(`[InitialSync] Error syncing ${tableName}: ${err.message}`);
        allSuccessful = false;
        // Continue with other tables rather than aborting entirely
      }
    }

    // Mark initial sync as complete only if AT LEAST ONE table successfully synced.
    // If we failed completely due to a fatal error, do not mark as complete.
    if (tablesSynced.length > 0) {
      const timestamp = now();
      this.db.prepare(`
        INSERT INTO sync_metadata (id, workspace_id, initial_sync_completed, initial_sync_at, last_full_sync_at, tables_synced, created_at, updated_at)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?)
        ON CONFLICT(workspace_id) DO UPDATE SET 
          initial_sync_completed = 1,
          initial_sync_at = excluded.initial_sync_at,
          last_full_sync_at = excluded.last_full_sync_at,
          tables_synced = excluded.tables_synced,
          updated_at = excluded.updated_at
      `).run(
        `sync_${workspaceId}`,
        workspaceId,
        timestamp,
        timestamp,
        JSON.stringify(tablesSynced),
        timestamp,
        timestamp
      );
      
      SyncLogger.info(`[InitialSync] Complete. Inserted ${totalDownloaded} records across ${tablesSynced.length} tables.`);
      AppEvents.broadcastToRenderers('sync:initial-complete', {
        workspaceId,
        totalDownloaded,
        tablesSynced,
        allSuccessful
      });
    } else {
      SyncLogger.error(`[InitialSync] FATAL: All tables failed to sync. Initial Sync aborted.`);
      AppEvents.broadcastToRenderers('sync:initial-error', {
        workspaceId,
        error: 'Initial sync failed completely.'
      });
      return false;
    }

    return allSuccessful;
  }
}
