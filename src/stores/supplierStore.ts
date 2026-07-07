import { create } from 'zustand';
import supplierService from '../services/supplierService';
import type { StockPurchase, Supplier } from '../backend/types';

export type { Supplier };

export interface SupplierStats {
  totalProducts: number;
  totalCost: number;
}

interface SupplierStore {
  suppliers: Supplier[];
  initializeFromDatabase: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSupplier: (id: number, updates: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;
  getSupplierById: (id: number) => Supplier | undefined;
  getSupplierProducts: (supplierId: number) => Promise<any[]>;
  getSupplierStats: (supplierId: number) => Promise<SupplierStats>;
  getSupplierStockPurchases: (supplierId: number) => Promise<StockPurchase[]>;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],

  initializeFromDatabase: async () => {
    try {
      const suppliers = await supplierService.getSuppliers();
      set({ suppliers });
    } catch (error) {
      console.error('Failed to initialize suppliers from database:', error);
      set({ suppliers: [] });
    }
  },

  addSupplier: async (supplierData) => {
    try {
      const supplier = await supplierService.addSupplier(supplierData);
      set(state => ({
        suppliers: [...state.suppliers, supplier]
      }));
    } catch (error) {
      console.error('Failed to add supplier:', error);
      throw error;
    }
  },

  updateSupplier: async (id, updates) => {
    try {
      await supplierService.updateSupplier(id, updates);
      set(state => ({
        suppliers: state.suppliers.map(s => 
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        )
      }));
    } catch (error) {
      console.error('Failed to update supplier:', error);
    }
  },

  deleteSupplier: async (id) => {
    try {
      await supplierService.deleteSupplier(id);
      set(state => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    }
  },

  getSupplierById: (id) => {
    return get().suppliers.find(s => s.id === id);
  },

  getSupplierProducts: async (supplierId) => {
    try {
      return await supplierService.getSupplierProducts(supplierId);
    } catch (error) {
      console.error('Failed to get supplier products:', error);
      return [];
    }
  },

  getSupplierStats: async (supplierId) => {
    try {
      return await supplierService.getSupplierStats(supplierId);
    } catch (error) {
      console.error('Failed to get supplier stats:', error);
      return { totalProducts: 0, totalCost: 0 };
    }
  },

  getSupplierStockPurchases: async (supplierId) => {
    try {
      return await supplierService.getSupplierStockPurchases(supplierId);
    } catch (error) {
      console.error('Failed to get supplier stock purchases:', error);
      return [];
    }
  },
}));