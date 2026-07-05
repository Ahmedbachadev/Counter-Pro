import { getProvider } from '../providers';
import type { Sale, SaleItem } from '../types';

export const saleRepository = {
  async getSales(): Promise<Sale[]> {
    return getProvider().getSales();
  },

  async getSalesWithItems(): Promise<(Sale & { items: any[] })[]> {
    return getProvider().getSalesWithItems();
  },

  async addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale> {
    return getProvider().addSale(sale, items);
  },

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return getProvider().getSaleItems(saleId);
  },

  async updateSale(saleId: number, updates: Partial<Sale>, items?: any[]): Promise<void> {
    return getProvider().updateSale(saleId, updates, items);
  },

  async deleteSale(saleId: number): Promise<void> {
    return getProvider().deleteSale(saleId);
  }
};

export default saleRepository;
