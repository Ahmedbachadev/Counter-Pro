import Database from 'better-sqlite3';
import { QueueManager } from '../QueueManager';
import { UploadManager } from './UploadManager';
import { DownloadManager } from './DownloadManager';
import { ProgressManager } from './ProgressManager';
import { ConflictDetector } from './ConflictDetector';
import { SyncLogger } from './SyncLogger';
import { RetryManager } from './RetryManager';

export class SyncEngine {
  private db: Database.Database;
  private queueManager: QueueManager;
  private uploadManager: UploadManager;
  private downloadManager: DownloadManager;
  private progress: ProgressManager;
  
  private isSyncing: boolean = false;
  private currentWorkspaceId: string | null = null;
  
  // Settings
  private batchSize: number = 50;

  constructor(db: Database.Database, queueManager: QueueManager) {
    this.db = db;
    this.queueManager = queueManager;
    
    this.progress = new ProgressManager();
    const conflictDetector = new ConflictDetector(this.db);
    
    this.uploadManager = new UploadManager(this.queueManager, this.progress);
    this.downloadManager = new DownloadManager(this.db, this.progress, conflictDetector);
  }

  /**
   * Executes a complete synchronization cycle for the given workspace.
   */
  public async sync(workspaceId: string): Promise<void> {
    if (this.isSyncing) {
      SyncLogger.warn('Sync already in progress, skipping request.');
      return;
    }

    this.isSyncing = true;
    this.currentWorkspaceId = workspaceId;
    SyncLogger.info(`Starting sync cycle for workspace ${workspaceId}`);

    try {
      // 0. Analyze queue
      const allPending = this.queueManager.getPendingOperations(workspaceId, 1000); // Or use pagination for huge queues
      
      // Filter out items that are failed but not ready for retry
      const readyToUpload = allPending.filter(item => {
        if (item.status === 'failed') {
          return RetryManager.shouldRetry(item.retry_count, item.created_at);
        }
        return true;
      });

      this.progress.reset(readyToUpload.length);

      // 1 & 2. Upload pending local changes in batches and await confirmation
      if (readyToUpload.length > 0) {
        // We chunk the readyToUpload array by batchSize
        for (let i = 0; i < readyToUpload.length; i += this.batchSize) {
          const batch = readyToUpload.slice(i, i + this.batchSize);
          await this.uploadManager.uploadPending(workspaceId, batch);
        }
      } else {
        SyncLogger.info('No pending uploads.');
      }

      // 3, 4, 5, 6, 7. Download remote changes, resolve conflicts, and apply
      await this.downloadManager.downloadChanges(workspaceId);

      // 8. Finish
      this.progress.finish();
      SyncLogger.info('Sync cycle completed successfully.');
    } catch (err) {
      SyncLogger.error('Sync cycle failed completely', err);
      this.progress.setStage('error', 'Critical failure during sync');
    } finally {
      this.isSyncing = false;
      this.currentWorkspaceId = null;
    }
  }

  public get isRunning() {
    return this.isSyncing;
  }
}
