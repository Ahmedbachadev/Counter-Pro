import { supplierRepository } from '../backend/repositories/SupplierRepository';
import { getProvider } from '../backend/providers';
import type {
  Supplier,
  Product,
  StockPurchase,
  PurchaseEntry,
  PurchaseEntryItem
} from '../backend/types';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const useLocal = () => isElectron && typeof navigator !== 'undefined' && !navigator.onLine;

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    return useLocal() ? supplierRepository.getSuppliers() : getProvider().getSuppliers();
  },

  async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return useLocal() ? supplierRepository.addSupplier(supplier) : getProvider().addSupplier(supplier);
  },

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
    return useLocal() ? supplierRepository.updateSupplier(id, updates) : getProvider().updateSupplier(id, updates);
  },

  async deleteSupplier(id: number): Promise<void> {
    return useLocal() ? supplierRepository.deleteSupplier(id) : getProvider().deleteSupplier(id);
  },

  async getSupplierProducts(supplierId: number): Promise<Product[]> {
    return useLocal() ? supplierRepository.getSupplierProducts(supplierId) : getProvider().getSupplierProducts(supplierId);
  },

  async getSupplierStats(supplierId: number): Promise<{ totalProducts: number; totalCost: number }> {
    return useLocal() ? supplierRepository.getSupplierStats(supplierId) : getProvider().getSupplierStats(supplierId);
  },

  async addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase> {
    return useLocal() ? supplierRepository.addStockPurchase(purchase) : getProvider().addStockPurchase(purchase);
  },

  async getSupplierStockPurchases(supplierId: number): Promise<StockPurchase[]> {
    return useLocal() ? supplierRepository.getSupplierStockPurchases(supplierId) : getProvider().getSupplierStockPurchases(supplierId);
  },

  async getProductStockPurchases(productId: number): Promise<StockPurchase[]> {
    return useLocal() ? supplierRepository.getProductStockPurchases(productId) : getProvider().getProductStockPurchases(productId);
  },

  async getAllStockPurchases(): Promise<StockPurchase[]> {
    return useLocal() ? supplierRepository.getAllStockPurchases() : getProvider().getAllStockPurchases();
  },

  async getPurchaseEntries(): Promise<PurchaseEntry[]> {
    return useLocal() ? supplierRepository.getPurchaseEntries() : getProvider().getPurchaseEntries();
  },

  async addPurchaseEntry(
    entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  ): Promise<PurchaseEntry> {
    return useLocal() ? supplierRepository.addPurchaseEntry(entry, items) : getProvider().addPurchaseEntry(entry, items);
  }
};

export default supplierService;

