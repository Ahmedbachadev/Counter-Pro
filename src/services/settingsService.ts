import { settingsRepository } from '../backend/repositories/SettingsRepository';
import type { ShopSettings } from '../backend/types';

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    return settingsRepository.getSettings();
  },

  async updateSettings(updates: Partial<ShopSettings>): Promise<void> {
    return settingsRepository.updateSettings(updates);
  },

  async exportData(): Promise<void> {
    return settingsRepository.exportData();
  },

  async importData(file?: File): Promise<void> {
    return settingsRepository.importData(file);
  },

  async exportSettings(): Promise<void> {
    return settingsRepository.exportSettings();
  },

  async importSettings(file?: File): Promise<void> {
    return settingsRepository.importSettings(file);
  },

  async resetPreferences(): Promise<void> {
    return settingsRepository.resetPreferences();
  },

  async clearDemoData(): Promise<void> {
    return settingsRepository.clearDemoData();
  },

  async resetSampleData(): Promise<void> {
    return settingsRepository.resetSampleData();
  },

  getDatabaseType(): 'sqlite' | 'json' {
    return settingsRepository.getDatabaseType();
  },

  setDatabaseType(type: 'sqlite' | 'json'): void {
    settingsRepository.setDatabaseType(type);
  },

  async syncDatabases(): Promise<void> {
    return settingsRepository.syncDatabases();
  }
};

export default settingsService;

