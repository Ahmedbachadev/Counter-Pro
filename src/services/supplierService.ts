import { supplierRepository } from '../backend/repositories/SupplierRepository';
import type {
  Supplier,
  Product,
  StockPurchase,
  PurchaseEntry,
  PurchaseEntryItem
} from '../backend/types';

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    return supplierRepository.getSuppliers();
  },

  async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return supplierRepository.addSupplier(supplier);
  },

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
    return supplierRepository.updateSupplier(id, updates);
  },

  async deleteSupplier(id: number): Promise<void> {
    return supplierRepository.deleteSupplier(id);
  },

  async getSupplierProducts(supplierId: number): Promise<Product[]> {
    return supplierRepository.getSupplierProducts(supplierId);
  },

  async getSupplierStats(supplierId: number): Promise<{ totalProducts: number; totalCost: number }> {
    return supplierRepository.getSupplierStats(supplierId);
  },

  async addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase> {
    return supplierRepository.addStockPurchase(purchase);
  },

  async getSupplierStockPurchases(supplierId: number): Promise<StockPurchase[]> {
    return supplierRepository.getSupplierStockPurchases(supplierId);
  },

  async getProductStockPurchases(productId: number): Promise<StockPurchase[]> {
    return supplierRepository.getProductStockPurchases(productId);
  },

  async getAllStockPurchases(): Promise<StockPurchase[]> {
    return supplierRepository.getAllStockPurchases();
  },

  async getPurchaseEntries(): Promise<PurchaseEntry[]> {
    return supplierRepository.getPurchaseEntries();
  },

  async addPurchaseEntry(
    entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  ): Promise<PurchaseEntry> {
    return supplierRepository.addPurchaseEntry(entry, items);
  }
};

export default supplierService;

