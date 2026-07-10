export type BackupType = 'Full' | 'Incremental' | 'Settings' | 'Manual';
export type BackupStatus = 'completed' | 'in_progress' | 'failed' | 'corrupted';

export interface BackupRecord {
  id: string;
  createdAt: string;
  type: BackupType;
  sizeBytes: number;
  compressedSizeBytes: number;
  version: string;
  durationMs: number;
  status: BackupStatus;
  verificationPassed: boolean;
  location: string;
  createdBy: string;
  tablesIncluded: string[];
  totalRecords: number;
  checksum: string;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_exit';
  retentionPolicy: 'keep_5' | 'keep_10' | 'keep_30' | 'keep_all';
  compressionEnabled: boolean;
  defaultLocation: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export interface RestoreWizardState {
  isOpen: boolean;
  step: number;
  selectedBackupId: string | null;
  restoreOptions: {
    products: boolean;
    customers: boolean;
    sales: boolean;
    inventory: boolean;
    settings: boolean;
  };
  verificationStatus: 'idle' | 'checking' | 'passed' | 'failed';
  isRestoring: boolean;
  error: string | null;
}
