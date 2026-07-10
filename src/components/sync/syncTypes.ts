export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BULK_UPDATE' | 'BULK_DELETE';

export interface SyncQueueItem {
  id: string;
  workspace_id: string;
  table_name: string;
  record_id: string;
  operation: SyncOperation;
  payload: string;
  created_at: string;
  retry_count: number;
  priority: number;
  status: SyncStatus;
  error_message: string | null;
  device_id: string;
  version: number;
}

export interface SyncConflict {
  id: string;
  record_id: string;
  table_name: string;
  cloud_version: any;
  local_version: any;
  modified_by: string;
  modified_time: string;
  conflict_type: 'update_update' | 'delete_update' | 'update_delete';
  status: 'unresolved' | 'resolved';
}

export interface SyncLog {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  duration_ms: number;
  result: 'success' | 'error' | 'warning';
  error_details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
