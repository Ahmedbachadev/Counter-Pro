import { QueueManager } from '../QueueManager';
import { SyncQueueItem } from '../../types';
import { mainSupabase } from './MainSupabaseClient';
import { SyncLogger } from './SyncLogger';
import { ProgressManager } from './ProgressManager';
import { TABLE_MAPPINGS } from './TableMapping';

export class UploadManager {
  private queueManager: QueueManager;
  private progress: ProgressManager;

  constructor(queueManager: QueueManager, progress: ProgressManager) {
    this.queueManager = queueManager;
    this.progress = progress;
  }

  public async uploadPending(workspaceId: string, items: SyncQueueItem[]): Promise<boolean> {
    if (items.length === 0) return true;
    if (!mainSupabase) {
      SyncLogger.error('Supabase client is not initialized in Main Process');
      return false;
    }

    this.progress.setStage('uploading', 'Uploading pending changes to cloud');

    // Group items by table
    const itemsByTable = items.reduce((acc, item) => {
      if (!acc[item.table_name]) acc[item.table_name] = [];
      acc[item.table_name].push(item);
      return acc;
    }, {} as Record<string, SyncQueueItem[]>);

    let allSuccessful = true;

    for (const [tableName, tableItems] of Object.entries(itemsByTable)) {
      this.progress.setModule(tableName);
      SyncLogger.info(`Uploading ${tableItems.length} items to ${tableName}`);

      // We use upsert for CREATE, UPDATE, and DELETE.
      // For DELETE, we implement a Soft Delete on Supabase so other offline devices can sync it.
      const upserts = tableItems.map(i => {
        const payload = JSON.parse(i.payload);
        
        // Strip local-only sync tracking columns before sending to Supabase
        delete payload.sync_status;
        delete payload.version;
        delete payload.device_id;
        delete payload.last_synced_at;
        
        // If this was a local delete (soft or hard), ensure it soft-deletes on Supabase
        if (i.operation === 'DELETE' && !payload.deleted_at) {
          payload.deleted_at = new Date().toISOString();
        }
        
        return payload;
      });

      const mapping = TABLE_MAPPINGS[tableName] || { remoteTable: tableName, workspaceFiltered: true };

      try {
        if (upserts.length > 0) {
          const { error } = await mainSupabase.from(mapping.remoteTable).upsert(upserts);
          if (error) throw error;
        }

        // If successful, remove these items from local sync_queue
        this.queueManager.removeItems(tableItems.map(i => i.id));
        this.progress.addUpload(tableItems.length);
        SyncLogger.info(`Successfully uploaded to ${tableName}`);

      } catch (err: any) {
        SyncLogger.error(`Upload failed for ${tableName}`, err);
        allSuccessful = false;
        this.progress.addFailure(tableItems.length);

        // Mark them as failed so the RetryManager can pick them up later
        tableItems.forEach(item => {
          this.queueManager.updateStatus(item.id, 'failed', err.message || 'Unknown error');
        });
      }
    }

    return allSuccessful;
  }
}
