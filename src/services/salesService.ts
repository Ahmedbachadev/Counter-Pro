import { saleRepository } from '../backend/repositories/SaleRepository';
import { getProvider } from '../backend/providers';
import type { Sale, SaleItem } from '../backend/types';

// Offline-first: Electron always reads/writes SQLite. Sync engine handles Supabase.
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const salesService = {
  async getSales(): Promise<Sale[]> {
    return isElectron ? saleRepository.getSales() : getProvider().getSales();
  },

  async getSalesWithItems(): Promise<(Sale & { items: any[] })[]> {
    return isElectron ? saleRepository.getSalesWithItems() : getProvider().getSalesWithItems();
  },

  async addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale> {
    return isElectron ? saleRepository.addSale(sale, items) : getProvider().addSale(sale, items);
  },

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return isElectron ? saleRepository.getSaleItems(saleId) : getProvider().getSaleItems(saleId);
  },

  async updateSale(saleId: number, updates: Partial<Sale>, items?: any[]): Promise<void> {
    return isElectron ? saleRepository.updateSale(saleId, updates, items) : getProvider().updateSale(saleId, updates, items);
  },

  async deleteSale(saleId: number): Promise<void> {
    return isElectron ? saleRepository.deleteSale(saleId) : getProvider().deleteSale(saleId);
  }
};

export default salesService;
