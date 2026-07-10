import { QueueManager } from '../QueueManager';
import { SyncQueueItem } from '../../types';
import { mainSupabase } from './MainSupabaseClient';
import { SyncLogger } from './SyncLogger';
import { ProgressManager } from './ProgressManager';

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

      // We use upsert for both CREATE and UPDATE because the payload already contains the correct ID.
      // For DELETE, we might need a separate call if Supabase supports bulk delete via in().
      const upserts = tableItems
        .filter(i => i.operation !== 'DELETE')
        .map(i => JSON.parse(i.payload));

      const deletes = tableItems
        .filter(i => i.operation === 'DELETE')
        .map(i => i.record_id);

      try {
        if (upserts.length > 0) {
          const { error } = await mainSupabase.from(tableName).upsert(upserts);
          if (error) throw error;
        }

        if (deletes.length > 0) {
          const { error } = await mainSupabase.from(tableName).delete().in('id', deletes);
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
