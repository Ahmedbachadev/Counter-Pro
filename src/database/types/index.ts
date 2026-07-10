export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BULK_UPDATE' | 'BULK_DELETE';

export interface SyncQueueItem {
  id: string;
  workspace_id: string;
  table_name: string;
  record_id: string;
  operation: SyncOperation;
  payload: string; // JSON string
  created_at: string;
  retry_count: number;
  priority: number;
  status: SyncStatus;
  error_message: string | null;
  device_id: string;
  version: number;
}

export interface BaseRecord {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
  version: number;
  device_id: string;
  last_synced_at: string | null;
}

// Custom error for Database operations
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}
