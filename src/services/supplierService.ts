import { supplierRepository } from '../backend/repositories/SupplierRepository';
import { getProvider } from '../backend/providers';
import type {
  Supplier,
  Product,
  StockPurchase,
  PurchaseEntry,
  PurchaseEntryItem
} from '../backend/types';

// Offline-first: Electron always reads/writes SQLite. Sync engine handles Supabase.
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    return isElectron ? supplierRepository.getSuppliers() : getProvider().getSuppliers();
  },

  async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return isElectron ? supplierRepository.addSupplier(supplier) : getProvider().addSupplier(supplier);
  },

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
    return isElectron ? supplierRepository.updateSupplier(id, updates) : getProvider().updateSupplier(id, updates);
  },

  async deleteSupplier(id: number): Promise<void> {
    return isElectron ? supplierRepository.deleteSupplier(id) : getProvider().deleteSupplier(id);
  },

  async getSupplierProducts(supplierId: number): Promise<Product[]> {
    return isElectron ? supplierRepository.getSupplierProducts(supplierId) : getProvider().getSupplierProducts(supplierId);
  },

  async getSupplierStats(supplierId: number): Promise<{ totalProducts: number; totalCost: number }> {
    return isElectron ? supplierRepository.getSupplierStats(supplierId) : getProvider().getSupplierStats(supplierId);
  },

  async addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase> {
    return isElectron ? supplierRepository.addStockPurchase(purchase) : getProvider().addStockPurchase(purchase);
  },

  async getSupplierStockPurchases(supplierId: number): Promise<StockPurchase[]> {
    return isElectron ? supplierRepository.getSupplierStockPurchases(supplierId) : getProvider().getSupplierStockPurchases(supplierId);
  },

  async getProductStockPurchases(productId: number): Promise<StockPurchase[]> {
    return isElectron ? supplierRepository.getProductStockPurchases(productId) : getProvider().getProductStockPurchases(productId);
  },

  async getAllStockPurchases(): Promise<StockPurchase[]> {
    return isElectron ? supplierRepository.getAllStockPurchases() : getProvider().getAllStockPurchases();
  },

  async getPurchaseEntries(): Promise<PurchaseEntry[]> {
    return isElectron ? supplierRepository.getPurchaseEntries() : getProvider().getPurchaseEntries();
  },

  async addPurchaseEntry(
    entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  ): Promise<PurchaseEntry> {
    return isElectron ? supplierRepository.addPurchaseEntry(entry, items) : getProvider().addPurchaseEntry(entry, items);
  }
};

export default supplierService;
