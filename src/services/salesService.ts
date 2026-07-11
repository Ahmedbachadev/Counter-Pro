import { saleRepository } from '../backend/repositories/SaleRepository';
import { getProvider } from '../backend/providers';
import type { Sale, SaleItem } from '../backend/types';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const useLocal = () => isElectron && typeof navigator !== 'undefined' && !navigator.onLine;

export const salesService = {
  async getSales(): Promise<Sale[]> {
    return useLocal() ? saleRepository.getSales() : getProvider().getSales();
  },

  async getSalesWithItems(): Promise<(Sale & { items: any[] })[]> {
    return useLocal() ? saleRepository.getSalesWithItems() : getProvider().getSalesWithItems();
  },

  async addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale> {
    return useLocal() ? saleRepository.addSale(sale, items) : getProvider().addSale(sale, items);
  },

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return useLocal() ? saleRepository.getSaleItems(saleId) : getProvider().getSaleItems(saleId);
  },

  async updateSale(saleId: number, updates: Partial<Sale>, items?: any[]): Promise<void> {
    return useLocal() ? saleRepository.updateSale(saleId, updates, items) : getProvider().updateSale(saleId, updates, items);
  },

  async deleteSale(saleId: number): Promise<void> {
    return useLocal() ? saleRepository.deleteSale(saleId) : getProvider().deleteSale(saleId);
  }
};

export default salesService;

