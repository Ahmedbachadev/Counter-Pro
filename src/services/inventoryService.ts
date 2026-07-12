import { productRepository } from '../backend/repositories/ProductRepository';
import { getProvider } from '../backend/providers';
import type {
  Category,
  Product,
  StockAdjustment,
  StockMovement,
  InventoryAuditLog
} from '../backend/types';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const useLocal = () => isElectron;

export const inventoryService = {
  async getCategories(): Promise<Category[]> {
    return useLocal() ? productRepository.getCategories() : getProvider().getCategories();
  },

  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    return useLocal() ? productRepository.addCategory(category) : getProvider().addCategory(category);
  },

  async updateCategory(id: number, updates: Partial<Category>): Promise<void> {
    return useLocal() ? productRepository.updateCategory(id, updates) : getProvider().updateCategory(id, updates);
  },

  async deleteCategory(id: number): Promise<void> {
    return useLocal() ? productRepository.deleteCategory(id) : getProvider().deleteCategory(id);
  },

  async getProducts(): Promise<Product[]> {
    return useLocal() ? productRepository.getProducts() : getProvider().getProducts();
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return useLocal() ? productRepository.addProduct(product) : getProvider().addProduct(product);
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    return useLocal() ? productRepository.updateProduct(id, updates) : getProvider().updateProduct(id, updates);
  },

  async deleteProduct(id: number): Promise<void> {
    return useLocal() ? productRepository.deleteProduct(id) : getProvider().deleteProduct(id);
  },

  async updateProductStock(id: number, change: number): Promise<void> {
    return useLocal() ? productRepository.updateProductStock(id, change) : getProvider().updateProductStock(id, change);
  },

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return useLocal() ? productRepository.getStockAdjustments() : getProvider().getStockAdjustments();
  },

  async addStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> {
    return useLocal() ? productRepository.addStockAdjustment(adj) : getProvider().addStockAdjustment(adj);
  },

  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    return useLocal() ? productRepository.getStockMovements(productId) : getProvider().getStockMovements(productId);
  },

  async addStockMovement(
    productId: number,
    productName: string,
    actionType: string,
    qtyBefore: number,
    qtyChanged: number,
    qtyAfter: number,
    reference?: string,
    notes?: string,
    user?: string
  ): Promise<void> {
    if (useLocal()) {
      return productRepository.addStockMovement(productId, productName, actionType, qtyBefore, qtyChanged, qtyAfter, reference, notes, user);
    } else {
      return getProvider().addStockMovement(productId, productName, actionType, qtyBefore, qtyChanged, qtyAfter, reference, notes, user);
    }
  },

  async getInventoryAuditLogs(): Promise<InventoryAuditLog[]> {
    return useLocal() ? productRepository.getInventoryAuditLogs() : getProvider().getInventoryAuditLogs();
  },

  async addInventoryAuditLog(action: string, reference: string, description: string, user?: string): Promise<void> {
    if (useLocal()) {
      return productRepository.addInventoryAuditLog(action, reference, description, user);
    } else {
      return getProvider().addInventoryAuditLog(action, reference, description, user);
    }
  }
};

export default inventoryService;

