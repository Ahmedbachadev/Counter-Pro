import { getProvider } from '../providers';
import type { Supplier, Product, StockPurchase, PurchaseEntry, PurchaseEntryItem } from '../types';

export const supplierRepository = {
  async getSuppliers(): Promise<Supplier[]> {
    return getProvider().getSuppliers();
  },

  async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return getProvider().addSupplier(supplier);
  },

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
    return getProvider().updateSupplier(id, updates);
  },

  async deleteSupplier(id: number): Promise<void> {
    return getProvider().deleteSupplier(id);
  },

  async getSupplierProducts(supplierId: number): Promise<Product[]> {
    return getProvider().getSupplierProducts(supplierId);
  },

  async getSupplierStats(supplierId: number): Promise<{ totalProducts: number; totalCost: number }> {
    return getProvider().getSupplierStats(supplierId);
  },

  async addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase> {
    return getProvider().addStockPurchase(purchase);
  },

  async getSupplierStockPurchases(supplierId: number): Promise<StockPurchase[]> {
    return getProvider().getSupplierStockPurchases(supplierId);
  },

  async getProductStockPurchases(productId: number): Promise<StockPurchase[]> {
    return getProvider().getProductStockPurchases(productId);
  },

  async getAllStockPurchases(): Promise<StockPurchase[]> {
    return getProvider().getAllStockPurchases();
  },

  async getPurchaseEntries(): Promise<PurchaseEntry[]> {
    return getProvider().getPurchaseEntries();
  },

  async addPurchaseEntry(
    entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  ): Promise<PurchaseEntry> {
    return getProvider().addPurchaseEntry(entry, items);
  }
};

export default supplierRepository;
