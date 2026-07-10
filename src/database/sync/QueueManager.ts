import Database from 'better-sqlite3';
import { SyncOperation, SyncQueueItem, SyncStatus } from '../types';
import { generateUUID, now } from '../utils/dbUtils';
import { AppEvents } from './AppEvents';

export class QueueManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Enqueues an operation into the sync queue, coalescing if necessary.
   */
  public enqueue(
    workspaceId: string,
    tableName: string,
    recordId: string,
    operation: SyncOperation,
    payload: any,
    deviceId: string = 'LOCAL'
  ): void {
    const transaction = this.db.transaction(() => {
      // 1. Find existing pending operations for this record
      const existingQuery = this.db.prepare(`
        SELECT * FROM sync_queue 
        WHERE workspace_id = ? AND table_name = ? AND record_id = ? AND status = 'pending'
        ORDER BY created_at ASC
      `);
      
      const existingItems = existingQuery.all(workspaceId, tableName, recordId) as SyncQueueItem[];
      
      if (existingItems.length > 0) {
        // We have coalescing logic to apply
        const firstOp = existingItems[0];
        const lastOp = existingItems[existingItems.length - 1];

        // Case A: Create -> Delete = Remove both, no sync needed.
        if (firstOp.operation === 'CREATE' && operation === 'DELETE') {
          const idsToRemove = existingItems.map(i => i.id);
          this.removeItems(idsToRemove);
          AppEvents.broadcastToRenderers('queue:removed', idsToRemove);
          return; // Do not enqueue the DELETE
        }

        // Case B: Create -> Update = Keep Create, update its payload.
        if (firstOp.operation === 'CREATE' && operation === 'UPDATE') {
          const mergedPayload = { ...JSON.parse(firstOp.payload), ...payload };
          this.db.prepare(`UPDATE sync_queue SET payload = ? WHERE id = ?`)
                 .run(JSON.stringify(mergedPayload), firstOp.id);
          
          AppEvents.broadcastToRenderers('queue:updated', firstOp.id);
          
          // Remove any intermediate updates
          if (existingItems.length > 1) {
             const idsToRemove = existingItems.slice(1).map(i => i.id);
             this.removeItems(idsToRemove);
             AppEvents.broadcastToRenderers('queue:removed', idsToRemove);
          }
          return;
        }

        // Case C: Update -> Update = Keep first Update (to maintain order), merge payload
        if (firstOp.operation === 'UPDATE' && operation === 'UPDATE') {
          const mergedPayload = { ...JSON.parse(lastOp.payload), ...payload };
          this.db.prepare(`UPDATE sync_queue SET payload = ? WHERE id = ?`)
                 .run(JSON.stringify(mergedPayload), lastOp.id); // Or firstOp
          AppEvents.broadcastToRenderers('queue:updated', lastOp.id);
          return;
        }

        // Case D: Update -> Delete = Keep Delete, remove Update
        if (firstOp.operation === 'UPDATE' && operation === 'DELETE') {
          const idsToRemove = existingItems.map(i => i.id);
          this.removeItems(idsToRemove);
          AppEvents.broadcastToRenderers('queue:removed', idsToRemove);
          // Fall through to enqueue the DELETE below
        }
      }

      // Default: insert new queue item
      const item: SyncQueueItem = {
        id: generateUUID(),
        workspace_id: workspaceId,
        table_name: tableName,
        record_id: recordId,
        operation,
        payload: JSON.stringify(payload || {}),
        created_at: now(),
        retry_count: 0,
        priority: 0,
        status: 'pending',
        error_message: null,
        device_id: deviceId,
        version: payload.version || 1
      };

      this.db.prepare(`
        INSERT INTO sync_queue (
          id, workspace_id, table_name, record_id, operation, payload, created_at, 
          retry_count, priority, status, error_message, device_id, version
        ) VALUES (
          @id, @workspace_id, @table_name, @record_id, @operation, @payload, @created_at,
          @retry_count, @priority, @status, @error_message, @device_id, @version
        )
      `).run(item);

      AppEvents.broadcastToRenderers('queue:added', item);
    });

    transaction();
  }

  public removeItems(ids: string[]): void {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`).run(ids);
  }

  public getPendingOperations(workspaceId: string, limit: number = 50): SyncQueueItem[] {
    return this.db.prepare(`
      SELECT * FROM sync_queue 
      WHERE workspace_id = ? AND status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT ?
    `).all(workspaceId, limit) as SyncQueueItem[];
  }

  public updateStatus(id: string, status: SyncStatus, errorMessage: string | null = null): void {
    this.db.prepare(`
      UPDATE sync_queue 
      SET status = ?, error_message = ?, retry_count = CASE WHEN ? = 'failed' THEN retry_count + 1 ELSE retry_count END
      WHERE id = ?
    `).run(status, errorMessage, status, id);
  }

  public clearQueue(workspaceId: string): void {
    this.db.prepare(`DELETE FROM sync_queue WHERE workspace_id = ?`).run(workspaceId);
  }

  public getQueueStats(workspaceId: string): { pending: number, syncing: number, failed: number } {
    const stats = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM sync_queue 
      WHERE workspace_id = ?
      GROUP BY status
    `).all(workspaceId) as { status: SyncStatus, count: number }[];

    return {
      pending: stats.find(s => s.status === 'pending')?.count || 0,
      syncing: stats.find(s => s.status === 'syncing')?.count || 0,
      failed: stats.find(s => s.status === 'failed')?.count || 0
    };
  }

  /**
   * On startup, validate and resume state
   */
  public recover(): void {
    // Reset any 'syncing' items back to 'pending' because the process restarted
    this.db.prepare(`UPDATE sync_queue SET status = 'pending' WHERE status = 'syncing'`).run();
  }
}
