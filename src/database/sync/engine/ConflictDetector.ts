import Database from 'better-sqlite3';
import { BaseRecord } from '../../types';
import { SyncLogger } from './SyncLogger';

export class ConflictDetector {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Evaluates if a downloaded cloud record conflicts with the local record.
   * Returns 'cloud_wins' if the remote record should be applied.
   * Returns 'local_wins' if the local record is newer (meaning an upload is pending or it's a conflict).
   * Returns 'identical' if they are the exact same version/timestamp.
   */
  public evaluate(tableName: string, cloudRecord: BaseRecord): 'cloud_wins' | 'local_wins' | 'identical' {
    // 1. Fetch the local record
    const localStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const localRecord = localStmt.get(cloudRecord.id) as BaseRecord | undefined;

    if (!localRecord) {
      // If local doesn't exist, cloud obviously wins (it's a new record from the cloud)
      return 'cloud_wins';
    }

    const cloudDate = new Date(cloudRecord.updated_at).getTime();
    const localDate = new Date(localRecord.updated_at).getTime();

    if (cloudDate === localDate && cloudRecord.version === localRecord.version) {
      return 'identical';
    }

    // Last Updated Wins Strategy
    if (cloudDate > localDate) {
      return 'cloud_wins';
    } else {
      // Local is newer. The user requested:
      // "Do NOT overwrite silently. Store every detected conflict. Mark: sync_status = conflict"
      
      // If local is strictly pending, it will be uploaded. But if they both evolved, it's a conflict.
      // We'll mark the local record as conflict.
      try {
        this.db.prepare(`UPDATE ${tableName} SET sync_status = 'conflict' WHERE id = ?`).run(localRecord.id);
        SyncLogger.warn(`Conflict detected in ${tableName} for record ${localRecord.id}. Marked as conflict.`);
      } catch (err) {
        SyncLogger.error(`Failed to mark conflict for ${localRecord.id}`, err);
      }
      return 'local_wins';
    }
  }
}
