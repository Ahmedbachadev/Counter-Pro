import { saleRepository } from '../backend/repositories/SaleRepository';
import type { Sale, SaleItem } from '../backend/types';

export const salesService = {
  async getSales(): Promise<Sale[]> {
    return saleRepository.getSales();
  },

  async getSalesWithItems(): Promise<(Sale & { items: any[] })[]> {
    return saleRepository.getSalesWithItems();
  },

  async addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale> {
    return saleRepository.addSale(sale, items);
  },

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return saleRepository.getSaleItems(saleId);
  },

  async updateSale(saleId: number, updates: Partial<Sale>, items?: any[]): Promise<void> {
    return saleRepository.updateSale(saleId, updates, items);
  },

  async deleteSale(saleId: number): Promise<void> {
    return saleRepository.deleteSale(saleId);
  }
};

export default salesService;

