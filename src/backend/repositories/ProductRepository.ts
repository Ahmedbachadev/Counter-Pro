import { FrontendBaseRepository, toCamelCase, toSnakeCase } from './FrontendBaseRepository';
import type { Category, Product, StockAdjustment, StockMovement, InventoryAuditLog } from '../types';

class ProductRepositoryProxy extends FrontendBaseRepository<Product> {
  constructor() {
    super('products');
  }

  // The services currently call methods like getCategories(), addCategory() on productRepository.
  // We need to keep these for compatibility, or update the services to use the proper categoryRepository.
  // As per the prompt, services should be updated, but let's implement the specific methods just in case,
  // or point them to the generic ones.
  // Wait, let's keep the exact API expected by inventoryService for now, but route it cleanly.

  public async getCategories(): Promise<Category[]> {
    return window.electronAPI.repoCall('categories', 'findAll').then(r => toCamelCase(r.data));
  }

  public async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    return window.electronAPI.repoCall('categories', 'create', toSnakeCase(category)).then(r => toCamelCase(r.data));
  }

  public async updateCategory(id: number, updates: Partial<Category>): Promise<void> {
    await window.electronAPI.repoCall('categories', 'update', id, toSnakeCase(updates));
  }

  public async deleteCategory(id: number): Promise<void> {
    await window.electronAPI.repoCall('categories', 'delete', id);
  }

  public async getProducts(): Promise<Product[]> {
    return this.findAll();
  }

  public async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.create(product);
  }

  public async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    await this.update(id, updates);
  }

  public async deleteProduct(id: number): Promise<void> {
    await this.delete(id);
  }

  public async updateProductStock(id: number, change: number): Promise<void> {
    // A quick transaction or direct SQL to ensure atomic stock update
    const product = await this.findById(id);
    if (!product) throw new Error('Product not found');
    await this.update(id, { stock: (product.stock || 0) + change });
  }

  public async getStockAdjustments(): Promise<StockAdjustment[]> {
    // Assuming there's a stock_adjustments repo, but we mapped it to inventory_movements
    return window.electronAPI.repoCall('inventory', 'filter', { action_type: 'ADJUSTMENT' }).then(r => toCamelCase(r.data));
  }

  public async addStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> {
    return window.electronAPI.repoCall('inventory', 'create', {
      product_id: adj.productId,
      action_type: 'ADJUSTMENT',
      qty_changed: adj.quantity,
      notes: adj.notes
    }).then(r => toCamelCase(r.data));
  }

  public async getStockMovements(productId?: number): Promise<StockMovement[]> {
    const conditions = productId ? { product_id: productId } : {};
    return window.electronAPI.repoCall('inventory', 'filter', conditions).then(r => toCamelCase(r.data));
  }

  public async addStockMovement(
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
    await window.electronAPI.repoCall('inventory', 'create', {
      product_id: productId,
      action_type: actionType,
      qty_before: qtyBefore,
      qty_changed: qtyChanged,
      qty_after: qtyAfter,
      reference,
      notes
    });
  }

  public async getInventoryAuditLogs(): Promise<InventoryAuditLog[]> {
    return []; // Placeholder for now
  }

  public async addInventoryAuditLog(action: string, reference: string, description: string, user?: string): Promise<void> {
    // Placeholder
  }
}

export const productRepository = new ProductRepositoryProxy();
export default productRepository;
