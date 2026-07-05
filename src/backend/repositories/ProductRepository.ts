import { getProvider } from '../providers';
import type { Category, Product, StockAdjustment, StockMovement, InventoryAuditLog } from '../types';

export const productRepository = {
  async getCategories(): Promise<Category[]> {
    return getProvider().getCategories();
  },

  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    return getProvider().addCategory(category);
  },

  async updateCategory(id: number, updates: Partial<Category>): Promise<void> {
    return getProvider().updateCategory(id, updates);
  },

  async deleteCategory(id: number): Promise<void> {
    return getProvider().deleteCategory(id);
  },

  async getProducts(): Promise<Product[]> {
    return getProvider().getProducts();
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return getProvider().addProduct(product);
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    return getProvider().updateProduct(id, updates);
  },

  async deleteProduct(id: number): Promise<void> {
    return getProvider().deleteProduct(id);
  },

  async updateProductStock(id: number, change: number): Promise<void> {
    return getProvider().updateProductStock(id, change);
  },

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return getProvider().getStockAdjustments();
  },

  async addStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> {
    return getProvider().addStockAdjustment(adj);
  },

  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    return getProvider().getStockMovements(productId);
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
    return getProvider().addStockMovement(
      productId,
      productName,
      actionType,
      qtyBefore,
      qtyChanged,
      qtyAfter,
      reference,
      notes,
      user
    );
  },

  async getInventoryAuditLogs(): Promise<InventoryAuditLog[]> {
    return getProvider().getInventoryAuditLogs();
  },

  async addInventoryAuditLog(action: string, reference: string, description: string, user?: string): Promise<void> {
    return getProvider().addInventoryAuditLog(action, reference, description, user);
  }
};

export default productRepository;
