import { BackupRecord } from './backupTypes';

export const mockBackups: BackupRecord[] = [
  {
    id: 'bk_full_001',
    createdAt: new Date().toISOString(),
    type: 'Full',
    sizeBytes: 15420000,
    compressedSizeBytes: 4200000,
    version: 'v2.1.4',
    durationMs: 4500,
    status: 'completed',
    verificationPassed: true,
    location: 'C:/Backups/KhataBook/',
    createdBy: 'System (Auto)',
    tablesIncluded: ['products', 'customers', 'sales', 'inventory', 'expenses', 'suppliers', 'settings'],
    totalRecords: 14520,
    checksum: 'a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2'
  },
  {
    id: 'bk_inc_002',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    type: 'Incremental',
    sizeBytes: 2150000,
    compressedSizeBytes: 850000,
    version: 'v2.1.4',
    durationMs: 1200,
    status: 'completed',
    verificationPassed: true,
    location: 'C:/Backups/KhataBook/',
    createdBy: 'System (Auto)',
    tablesIncluded: ['sales', 'inventory'],
    totalRecords: 340,
    checksum: 'f4a6b8c0d2a2b4c6d8e0f2a4b6c8d0e2'
  },
  {
    id: 'bk_man_003',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    type: 'Manual',
    sizeBytes: 14900000,
    compressedSizeBytes: 4100000,
    version: 'v2.1.3',
    durationMs: 4200,
    status: 'completed',
    verificationPassed: true,
    location: 'D:/ExternalDrive/Backups/',
    createdBy: 'Admin User',
    tablesIncluded: ['products', 'customers', 'sales', 'inventory', 'expenses', 'suppliers', 'settings'],
    totalRecords: 14100,
    checksum: 'e0f2a4b6c8d0e2f4a6b8c0d2a2b4c6d8'
  },
  {
    id: 'bk_err_004',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    type: 'Full',
    sizeBytes: 14800000,
    compressedSizeBytes: 0,
    version: 'v2.1.3',
    durationMs: 9500,
    status: 'failed',
    verificationPassed: false,
    location: 'C:/Backups/KhataBook/',
    createdBy: 'System (Auto)',
    tablesIncluded: [],
    totalRecords: 0,
    checksum: 'N/A'
  }
];
