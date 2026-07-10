import { create } from 'zustand';
import inventoryService from '../services/inventoryService';

export interface Category {
  id: number;
  name: string;
  nameUrdu: string;
  description?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  cost: number;
  price: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  nameUrdu?: string;
  categoryId: number;
  supplierId?: number;
  barcode?: string;
  sku?: string;
  brand?: string;
  price: number;
  cost: number;
  stock: number;
  initialStock: number;
  minStock: number;
  description?: string;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
  status?: 'Active' | 'Draft' | 'Discontinued';
  createdAt: string;
  updatedAt: string;
}

interface InventoryState {
  categories: Category[];
  products: Product[];
  initializeFromDatabase: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updated: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // MODIFIED: Function now returns a result object
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string; }>;
  updateProduct: (id: number, updated: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  updateStock: (id: number, change: number) => Promise<void>;
  getProductById: (id: number) => Product | undefined;
  getProductsByCategory: (categoryId: number) => Product[];
  getLowStockProducts: () => Product[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  categories: [],
  products: [],

  initializeFromDatabase: async () => {
    try {
      const categories = await inventoryService.getCategories();
      const products = await inventoryService.getProducts();
      set({ categories, products });
    } catch (error) {
      console.error('Failed to initialize inventory from database:', error);
      set({ categories: [], products: [] });
    }
  },

  addCategory: async (categoryData) => {
    try {
      const category = await inventoryService.addCategory(categoryData);
      set(state => ({
        categories: [...state.categories, category]
      }));
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      await inventoryService.updateCategory(id as any, updates);
      set(state => ({
        categories: state.categories.map(c =>
          c.id.toString() === id.toString() ? { ...c, ...updates } : c
        )
      }));
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await inventoryService.deleteCategory(id as any);
      set(state => ({
        categories: state.categories.filter(c => c.id.toString() !== id.toString())
      }));
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },

  // MODIFIED: Implemented duplication check and changed return type
  addProduct: async (productData) => {
    const { products } = get();

    // Check for duplicate Name (case-insensitive and trimming spaces)
    const isDuplicateByName = products.some(
      (p) => p.name.toLowerCase().trim() === productData.name.toLowerCase().trim()
    );

    if (isDuplicateByName) {
      return { 
        success: false, 
        message: 'Product already added with this name.' 
      };
    }
    
    // Optional: Check for duplicate Barcode if provided
    if (productData.barcode) {
        const isDuplicateByBarcode = products.some(
            (p) => p.barcode && p.barcode.trim() === productData.barcode.trim()
        );
        if (isDuplicateByBarcode) {
            return { 
                success: false, 
                message: 'Product already added with this barcode.' 
            };
        }
    }

    try {
      const product = await inventoryService.addProduct(productData);
      set(state => ({
        products: [...state.products, product]
      }));
      
      return { 
        success: true, 
        message: 'Product added successfully.' 
      };
    } catch (error) {
      console.error('Failed to add product:', error);
      return { 
        success: false, 
        message: 'Failed to add product due to a database error.' 
      };
    }
  },

  updateProduct: async (id, updates) => {
    try {
      await inventoryService.updateProduct(id, updates);
      set(state => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await inventoryService.deleteProduct(id);
      set(state => ({
        products: state.products.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  },

  updateStock: async (id, change) => {
    try {
      await inventoryService.updateProductStock(id, change);
      set(state => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, stock: p.stock + change, updatedAt: new Date().toISOString() } : p
        )
      }));
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  },

  getProductById: (id) => get().products.find(p => p.id === id),

  getProductsByCategory: (categoryId) =>
    get().products.filter(p => p.categoryId === categoryId),

  getLowStockProducts: () =>
    get().products.filter(p => p.stock <= p.minStock)
}));