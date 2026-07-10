import { SyncQueueItem, SyncConflict, SyncLog } from './syncTypes';

export const mockQueue: SyncQueueItem[] = [
  {
    id: 'q1',
    workspace_id: 'w1',
    table_name: 'products',
    record_id: 'p1',
    operation: 'CREATE',
    payload: JSON.stringify({ name: 'Wireless Mouse', price: 25.99, stock: 50 }),
    created_at: new Date().toISOString(),
    retry_count: 0,
    priority: 1,
    status: 'pending',
    error_message: null,
    device_id: 'd1',
    version: 1
  },
  {
    id: 'q2',
    workspace_id: 'w1',
    table_name: 'customers',
    record_id: 'c1',
    operation: 'UPDATE',
    payload: JSON.stringify({ phone: '+1234567890' }),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    retry_count: 3,
    priority: 2,
    status: 'failed',
    error_message: 'Network timeout during upload. Server took too long to respond.',
    device_id: 'd1',
    version: 2
  }
];

export const mockConflicts: SyncConflict[] = [
  {
    id: 'conf1',
    record_id: 'prod_123',
    table_name: 'products',
    cloud_version: { name: 'Mechanical Keyboard', price: 120.00, stock: 45, description: 'RGB Mechanical Keyboard (Blue Switches)' },
    local_version: { name: 'Mechanical Keyboard', price: 110.00, stock: 50, description: 'RGB Keyboard' },
    modified_by: 'user_cloud_99',
    modified_time: new Date(Date.now() - 7200000).toISOString(),
    conflict_type: 'update_update',
    status: 'unresolved'
  }
];

export const mockLogs: SyncLog[] = [
  {
    id: 'log1',
    timestamp: new Date().toISOString(),
    action: 'Sync Upload Completed',
    module: 'UploadManager',
    duration_ms: 450,
    result: 'success',
    severity: 'low'
  },
  {
    id: 'log2',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    action: 'Conflict Detected',
    module: 'ConflictDetector',
    duration_ms: 12,
    result: 'warning',
    error_details: 'Version mismatch on products table for record prod_123.',
    severity: 'medium'
  },
  {
    id: 'log3',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    action: 'Sync Download Failed',
    module: 'DownloadManager',
    duration_ms: 5005,
    result: 'error',
    error_details: 'Connection refused. Check internet connectivity.',
    severity: 'high'
  }
];
