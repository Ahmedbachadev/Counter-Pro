import { FrontendBaseRepository, toCamelCase, toSnakeCase } from './FrontendBaseRepository';
import type { Sale, SaleItem } from '../types';

class SaleRepositoryProxy extends FrontendBaseRepository<Sale> {
  constructor() {
    super('sales');
  }

  public async getSales(): Promise<Sale[]> {
    return this.findAll();
  }

  public async getSalesWithItems(): Promise<(Sale & { items: any[] })[]> {
    const sales = await this.findAll();
    const allItems = await window.electronAPI.repoCall('sale_items', 'findAll').then(r => toCamelCase(r.data));
    
    // Group items by sale_id
    const itemsBySale = allItems.reduce((acc: any, item: any) => {
      if (!acc[item.saleId]) acc[item.saleId] = [];
      acc[item.saleId].push(item);
      return acc;
    }, {});

    return sales.map(sale => ({
      ...sale,
      items: itemsBySale[sale.id] || []
    }));
  }

  public async addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale> {
    const createdSale = await this.create(sale);
    
    const snakeItems = items.map(item => ({ 
      ...toSnakeCase(item), 
      sale_id: createdSale.id 
    }));
    
    // Instead of bulkInsert which might be failing if sale_items doesn't exist yet, we invoke it
    await window.electronAPI.repoCall('sale_items', 'bulkInsert', snakeItems);
    
    return createdSale;
  }

  public async getSaleItems(saleId: number | string): Promise<SaleItem[]> {
    return window.electronAPI.repoCall('sale_items', 'filter', { sale_id: saleId }).then(r => toCamelCase(r.data));
  }

  public async updateSale(saleId: number | string, updates: Partial<Sale>, items?: any[]): Promise<void> {
    await this.update(saleId, updates);
    if (items && items.length > 0) {
      // Typically, an update to sale items involves deleting old ones and inserting new ones
      await window.electronAPI.repoCall('sale_items', 'delete', saleId); // Assuming we would delete by sale_id
      const snakeItems = items.map(item => ({ 
        ...toSnakeCase(item), 
        sale_id: saleId 
      }));
      await window.electronAPI.repoCall('sale_items', 'bulkInsert', snakeItems);
    }
  }

  public async deleteSale(saleId: number | string): Promise<void> {
    await this.delete(saleId);
  }
}

export const saleRepository = new SaleRepositoryProxy();
export default saleRepository;
