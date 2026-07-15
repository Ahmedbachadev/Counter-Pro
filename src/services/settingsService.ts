import { settingsRepository } from '../backend/repositories/SettingsRepository';
import { getProvider } from '../backend/providers';
import type { ShopSettings } from '../backend/types';

// Offline-first: Electron always reads/writes SQLite. Sync engine handles Supabase.
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    return isElectron ? settingsRepository.getSettings() : getProvider().getSettings();
  },

  async updateSettings(updates: Partial<ShopSettings>): Promise<void> {
    return isElectron ? settingsRepository.updateSettings(updates) : getProvider().updateSettings(updates);
  },

  async exportData(): Promise<void> {
    return isElectron ? settingsRepository.exportData() : getProvider().exportData();
  },

  async importData(file?: File): Promise<void> {
    return isElectron ? settingsRepository.importData(file) : getProvider().importData(file);
  },

  async exportSettings(): Promise<void> {
    return isElectron ? settingsRepository.exportSettings() : getProvider().exportSettings();
  },

  async importSettings(file?: File): Promise<void> {
    return isElectron ? settingsRepository.importSettings(file) : getProvider().importSettings(file);
  },

  async resetPreferences(): Promise<void> {
    return isElectron ? settingsRepository.resetPreferences() : getProvider().resetPreferences();
  },

  async clearDemoData(): Promise<void> {
    return isElectron ? settingsRepository.clearDemoData() : getProvider().clearDemoData();
  },

  async resetSampleData(): Promise<void> {
    return isElectron ? settingsRepository.resetSampleData() : getProvider().resetSampleData();
  },

  getDatabaseType(): 'sqlite' | 'json' {
    return isElectron ? settingsRepository.getDatabaseType() : 'json';
  },

  setDatabaseType(type: 'sqlite' | 'json'): void {
    if (isElectron) settingsRepository.setDatabaseType(type);
  },

  async syncDatabases(): Promise<void> {
    if (isElectron) return settingsRepository.syncDatabases();
    // Do nothing on web
  }
};

export default settingsService;
