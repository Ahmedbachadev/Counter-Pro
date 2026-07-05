import { productRepository } from '../backend/repositories/ProductRepository';
import type {
  Category,
  Product,
  StockAdjustment,
  StockMovement,
  InventoryAuditLog
} from '../backend/types';

export const inventoryService = {
  async getCategories(): Promise<Category[]> {
    return productRepository.getCategories();
  },

  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    return productRepository.addCategory(category);
  },

  async updateCategory(id: number, updates: Partial<Category>): Promise<void> {
    return productRepository.updateCategory(id, updates);
  },

  async deleteCategory(id: number): Promise<void> {
    return productRepository.deleteCategory(id);
  },

  async getProducts(): Promise<Product[]> {
    return productRepository.getProducts();
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return productRepository.addProduct(product);
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    return productRepository.updateProduct(id, updates);
  },

  async deleteProduct(id: number): Promise<void> {
    return productRepository.deleteProduct(id);
  },

  async updateProductStock(id: number, change: number): Promise<void> {
    return productRepository.updateProductStock(id, change);
  },

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return productRepository.getStockAdjustments();
  },

  async addStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> {
    return productRepository.addStockAdjustment(adj);
  },

  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    return productRepository.getStockMovements(productId);
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
    return productRepository.addStockMovement(
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
    return productRepository.getInventoryAuditLogs();
  },

  async addInventoryAuditLog(action: string, reference: string, description: string, user?: string): Promise<void> {
    return productRepository.addInventoryAuditLog(action, reference, description, user);
  }
};

export default inventoryService;

