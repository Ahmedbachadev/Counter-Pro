import { create } from 'zustand';
import { BackupRecord, BackupSettings, RestoreWizardState } from '../components/backup/backupTypes';
import { mockBackups } from '../components/backup/mockBackupData';

interface BackupState {
  backups: BackupRecord[];
  settings: BackupSettings;
  isCreatingBackup: boolean;
  wizardState: RestoreWizardState;
  
  // Actions
  setCreatingBackup: (status: boolean) => void;
  openRestoreWizard: (backupId?: string) => void;
  closeRestoreWizard: () => void;
  setWizardStep: (step: number) => void;
  setRestoreOptions: (options: Partial<RestoreWizardState['restoreOptions']>) => void;
  setWizardVerification: (status: RestoreWizardState['verificationStatus']) => void;
  executeRestore: () => Promise<void>;
  updateSettings: (settings: Partial<BackupSettings>) => void;
}

export const useBackupStore = create<BackupState>((set, get) => ({
  backups: mockBackups,
  settings: {
    autoBackupEnabled: true,
    frequency: 'daily',
    retentionPolicy: 'keep_10',
    compressionEnabled: true,
    defaultLocation: 'C:/Backups/KhataBook/',
    notifyOnSuccess: true,
    notifyOnFailure: true,
  },
  isCreatingBackup: false,
  wizardState: {
    isOpen: false,
    step: 1,
    selectedBackupId: null,
    restoreOptions: {
      products: true,
      customers: true,
      sales: true,
      inventory: true,
      settings: true,
    },
    verificationStatus: 'idle',
    isRestoring: false,
    error: null,
  },

  setCreatingBackup: (status) => set({ isCreatingBackup: status }),
  
  openRestoreWizard: (backupId) => set((state) => ({
    wizardState: {
      ...state.wizardState,
      isOpen: true,
      step: backupId ? 2 : 1,
      selectedBackupId: backupId || null,
      verificationStatus: 'idle',
      error: null,
    }
  })),

  closeRestoreWizard: () => set((state) => ({
    wizardState: {
      ...state.wizardState,
      isOpen: false,
      step: 1,
      selectedBackupId: null,
    }
  })),

  setWizardStep: (step) => set((state) => ({
    wizardState: { ...state.wizardState, step }
  })),

  setRestoreOptions: (options) => set((state) => ({
    wizardState: { 
      ...state.wizardState, 
      restoreOptions: { ...state.wizardState.restoreOptions, ...options } 
    }
  })),

  setWizardVerification: (status) => set((state) => ({
    wizardState: { ...state.wizardState, verificationStatus: status }
  })),

  executeRestore: async () => {
    set((state) => ({ wizardState: { ...state.wizardState, isRestoring: true, error: null } }));
    
    // Mock restore delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    set((state) => ({ wizardState: { ...state.wizardState, isRestoring: false, step: 6 } }));
  },

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
}));
