import { AppEvents } from '../AppEvents';

export type SyncStage = 'idle' | 'uploading' | 'downloading' | 'resolving' | 'finished' | 'error';

export interface SyncProgress {
  stage: SyncStage;
  currentModule: string;
  completedOperations: number;
  totalOperations: number;
  uploadCount: number;
  downloadCount: number;
  failedCount: number;
  retryCount: number;
  message?: string;
}

export class ProgressManager {
  private progress: SyncProgress = {
    stage: 'idle',
    currentModule: 'none',
    completedOperations: 0,
    totalOperations: 0,
    uploadCount: 0,
    downloadCount: 0,
    failedCount: 0,
    retryCount: 0
  };

  public reset(totalOperations: number = 0) {
    this.progress = {
      stage: 'idle',
      currentModule: 'none',
      completedOperations: 0,
      totalOperations,
      uploadCount: 0,
      downloadCount: 0,
      failedCount: 0,
      retryCount: 0
    };
    this.emit('sync:start');
  }

  public getProgress(): SyncProgress {
    return this.progress;
  }

  public setStage(stage: SyncStage, message?: string) {
    this.progress.stage = stage;
    this.progress.message = message;
    this.emit('sync:progress');
  }

  public setModule(module: string) {
    this.progress.currentModule = module;
    this.emit('sync:progress');
  }

  public addUpload(count: number = 1) {
    this.progress.uploadCount += count;
    this.progress.completedOperations += count;
    this.emit('sync:upload');
  }

  public addDownload(count: number = 1) {
    this.progress.downloadCount += count;
    this.progress.completedOperations += count;
    this.emit('sync:download');
  }

  public addFailure(count: number = 1) {
    this.progress.failedCount += count;
    this.progress.completedOperations += count;
    this.emit('sync:error');
  }

  public addRetry(count: number = 1) {
    this.progress.retryCount += count;
    this.emit('sync:retry');
  }

  public finish() {
    this.progress.stage = 'finished';
    this.emit('sync:complete');
  }

  private emit(event: string) {
    AppEvents.broadcastToRenderers(event, {
      ...this.progress,
      percentage: this.progress.totalOperations > 0 
        ? Math.round((this.progress.completedOperations / this.progress.totalOperations) * 100) 
        : 100
    });
  }
}
