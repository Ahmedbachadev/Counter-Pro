import { FrontendBaseRepository, toCamelCase, toSnakeCase } from './FrontendBaseRepository';
import type { ShopSettings } from '../types';

class SettingsRepositoryProxy extends FrontendBaseRepository<ShopSettings> {
  constructor() {
    super('settings');
  }

  public async getSettings(): Promise<ShopSettings> {
    const settings = await this.findAll();
    if (settings && settings.length > 0) {
      return toCamelCase(settings[0]);
    }
    // Return default empty settings if none exist
    return {} as ShopSettings;
  }

  public async updateSettings(updates: Partial<ShopSettings>): Promise<void> {
    const settingsList = await this.findAll();
    if (settingsList && settingsList.length > 0) {
      const id = (settingsList[0] as any).id;
      await this.update(id, updates);
    } else {
      await this.create({ id: '1', ...updates } as any);
    }
  }

  public async exportData(): Promise<void> {
    const response = await window.electronAPI.exportData();
    if (!response.success) throw new Error(response.error);
  }

  public async importData(file?: File): Promise<void> {
    const response = await window.electronAPI.importData();
    if (!response.success) throw new Error(response.error);
  }

  public async exportSettings(): Promise<void> {
    await this.exportData();
  }

  public async importSettings(file?: File): Promise<void> {
    await this.importData(file);
  }

  public async resetPreferences(): Promise<void> {
    // Optional implementation
  }

  public async clearDemoData(): Promise<void> {
    // Optional implementation
  }

  public async resetSampleData(): Promise<void> {
    // Optional implementation
  }

  public async syncDatabases(): Promise<void> {
    // Local DB is already active, sync is not implemented here
  }

  getDatabaseType(): 'sqlite' | 'json' {
    return 'sqlite';
  }

  setDatabaseType(type: 'sqlite' | 'json'): void {
    // Deprecated
  }
}

export const settingsRepository = new SettingsRepositoryProxy();
export default settingsRepository;
