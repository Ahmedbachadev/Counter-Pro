import { FrontendBaseRepository, toCamelCase, toSnakeCase } from './FrontendBaseRepository';
import type { Supplier, Product, StockPurchase, PurchaseEntry, PurchaseEntryItem } from '../types';

class SupplierRepositoryProxy extends FrontendBaseRepository<Supplier> {
  constructor() {
    super('suppliers');
  }

  public async getSuppliers(): Promise<Supplier[]> {
    return this.findAll();
  }

  public async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return this.create(supplier);
  }

  public async updateSupplier(id: number | string, updates: Partial<Supplier>): Promise<void> {
    await this.update(id, updates);
  }

  public async deleteSupplier(id: number | string): Promise<void> {
    await this.delete(id);
  }

  public async getSupplierProducts(supplierId: number | string): Promise<Product[]> {
    return window.electronAPI.repoCall('products', 'filter', { supplier_id: supplierId }).then(r => toCamelCase(r.data));
  }

  public async getSupplierStats(supplierId: number | string): Promise<{ totalProducts: number; totalCost: number }> {
    const products = await this.getSupplierProducts(supplierId);
    return {
      totalProducts: products.length,
      totalCost: products.reduce((sum, p) => sum + (p.cost * p.stock), 0)
    };
  }

  public async addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase> {
    // This goes to purchases repo or stock_purchases depending on how we structured it
    // Wait, we mapped it to purchases in the new SQLite schema? 
    // Wait, the migration has 'purchases' and 'purchase_items' tables. Let's just create it in 'purchases'.
    return window.electronAPI.repoCall('purchases', 'create', toSnakeCase(purchase)).then(r => toCamelCase(r.data));
  }

  public async getSupplierStockPurchases(supplierId: number | string): Promise<StockPurchase[]> {
    return window.electronAPI.repoCall('purchases', 'filter', { supplier_id: supplierId }).then(r => toCamelCase(r.data));
  }

  public async getProductStockPurchases(productId: number | string): Promise<StockPurchase[]> {
    // Actually this requires a JOIN with purchase_items. We'll fetch purchase_items and map them for now.
    return window.electronAPI.repoCall('purchase_items', 'filter', { product_id: productId }).then(r => toCamelCase(r.data));
  }

  public async getAllStockPurchases(): Promise<StockPurchase[]> {
    return window.electronAPI.repoCall('purchases', 'findAll').then(r => toCamelCase(r.data));
  }

  public async getPurchaseEntries(): Promise<PurchaseEntry[]> {
    return window.electronAPI.repoCall('purchases', 'findAll').then(r => toCamelCase(r.data));
  }

  public async addPurchaseEntry(
    entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  ): Promise<PurchaseEntry> {
    const purchase = await window.electronAPI.repoCall('purchases', 'create', toSnakeCase(entry)).then(r => toCamelCase(r.data));
    
    // Bulk insert items
    const snakeItems = items.map(item => ({ ...toSnakeCase(item), purchase_id: purchase.id }));
    await window.electronAPI.repoCall('purchase_items', 'bulkInsert', snakeItems);
    
    return purchase;
  }
}

export const supplierRepository = new SupplierRepositoryProxy();
export default supplierRepository;
