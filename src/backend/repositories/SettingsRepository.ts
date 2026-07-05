import { getProvider } from '../providers';
import type { ShopSettings } from '../types';

export const settingsRepository = {
  async getSettings(): Promise<ShopSettings> {
    return getProvider().getSettings();
  },

  async updateSettings(updates: Partial<ShopSettings>): Promise<void> {
    return getProvider().updateSettings(updates);
  },

  async exportData(): Promise<void> {
    return getProvider().exportData();
  },

  async importData(file?: File): Promise<void> {
    return getProvider().importData(file);
  },

  async exportSettings(): Promise<void> {
    return getProvider().exportSettings();
  },

  async importSettings(file?: File): Promise<void> {
    return getProvider().importSettings(file);
  },

  async resetPreferences(): Promise<void> {
    return getProvider().resetPreferences();
  },

  async clearDemoData(): Promise<void> {
    return getProvider().clearDemoData();
  },

  async resetSampleData(): Promise<void> {
    return getProvider().resetSampleData();
  },

  async syncDatabases(): Promise<void> {
    return getProvider().syncDatabases();
  },

  getDatabaseType(): 'sqlite' | 'json' {
    return 'sqlite'; // Deprecated method signature, returning default
  },

  setDatabaseType(type: 'sqlite' | 'json'): void {
    // Deprecated
  }
};

export default settingsRepository;
