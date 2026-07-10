import { SyncEngine } from './SyncEngine';
import { SyncLogger } from './SyncLogger';
import { QueueManager } from '../QueueManager';
import { AppEvents } from '../AppEvents';

export class SyncScheduler {
  private engine: SyncEngine;
  private queueManager: QueueManager;
  private timer: NodeJS.Timeout | null = null;
  
  // Settings
  private syncIntervalMs = 5 * 60 * 1000; // 5 minutes
  private thresholdLimit = 20; // Automatically sync if queue reaches 20
  
  private currentWorkspaceId: string | null = null;
  private isOnline: boolean = true;
  private queueListener: any;

  constructor(engine: SyncEngine, queueManager: QueueManager) {
    this.engine = engine;
    this.queueManager = queueManager;
    
    this.queueListener = () => this.onQueueAdded();
    AppEvents.on('queue:added', this.queueListener);
  }

  public initialize(workspaceId: string, initialNetworkStatus: boolean = true) {
    this.currentWorkspaceId = workspaceId;
    this.isOnline = initialNetworkStatus;
    
    // Automatically start sync when application launches or user signs in
    this.triggerSync('Initialization');
    
    // Start the timer
    this.startTimer();
  }

  public setNetworkStatus(isOnline: boolean) {
    if (!this.isOnline && isOnline) {
      this.isOnline = true;
      this.triggerSync('Internet reconnected');
    } else {
      this.isOnline = isOnline;
    }
  }

  public onQueueAdded() {
    if (!this.currentWorkspaceId) return;
    
    const stats = this.queueManager.getQueueStats(this.currentWorkspaceId);
    if (stats.pending >= this.thresholdLimit) {
      this.triggerSync('Queue threshold reached');
    }
  }

  public requestManualSync() {
    this.triggerSync('Manual request');
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentWorkspaceId = null;
    AppEvents.removeListener('queue:added', this.queueListener);
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.triggerSync('Timer expired');
    }, this.syncIntervalMs);
  }

  private triggerSync(reason: string) {
    if (!this.currentWorkspaceId) return;
    if (!this.isOnline) {
      SyncLogger.info(`Sync skipped (${reason}) - Device is offline`);
      return;
    }

    SyncLogger.info(`Sync triggered: ${reason}`);
    // SyncEngine will ignore if already running
    this.engine.sync(this.currentWorkspaceId).catch(err => {
      SyncLogger.error('Unhandled error in sync trigger', err);
    });
  }
}
