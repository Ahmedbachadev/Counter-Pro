import type {
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  ShopSettings,
  Supplier,
  StockPurchase,
  Expense,
  StockAdjustment,
  PurchaseEntry,
  PurchaseEntryItem,
  StockMovement,
  InventoryAuditLog,
  CustomerPayment,
  CustomerLoyaltyHistory,
  User
} from '../types';

export interface DataProvider {
  getCategories(): Promise<Category[]>;
  addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>;
  updateCategory(id: number | string, updates: Partial<Category>): Promise<void>;
  deleteCategory(id: number | string): Promise<void>;

  getSuppliers(): Promise<Supplier[]>;
  addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier>;
  updateSupplier(id: number | string, updates: Partial<Supplier>): Promise<void>;
  deleteSupplier(id: number | string): Promise<void>;
  getSupplierProducts(supplierId: number | string): Promise<Product[]>;
  getSupplierStats(supplierId: number | string): Promise<{ totalProducts: number; totalCost: number }>;

  addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase>;
  getSupplierStockPurchases(supplierId: number | string): Promise<StockPurchase[]>;
  getProductStockPurchases(productId: number | string): Promise<StockPurchase[]>;
  getAllStockPurchases(): Promise<StockPurchase[]>;

  getProducts(): Promise<Product[]>;
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: number | string, updates: Partial<Product>): Promise<void>;
  deleteProduct(id: number | string): Promise<void>;
  updateProductStock(id: number | string, change: number): Promise<void>;

  getCustomers(): Promise<Customer[]>;
  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>;
  updateCustomer(id: number | string, updates: Partial<Customer>): Promise<void>;
  deleteCustomer(id: number | string): Promise<void>;
  getCustomerPayments(customerId: number | string): Promise<CustomerPayment[]>;
  addCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment>;
  getCustomerLoyaltyHistory(customerId: number | string): Promise<CustomerLoyaltyHistory[]>;
  addCustomerLoyaltyHistory(history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>): Promise<CustomerLoyaltyHistory>;
  updateCustomerBalance(id: number | string, amount: number): Promise<void>;
  updateCustomerLoyaltyPoints(id: number | string, pointsChange: number): Promise<void>;

  getSales(): Promise<Sale[]>;
  getSalesWithItems(): Promise<(Sale & { items: any[] })[]>;
  addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale>;
  getSaleItems(saleId: number | string): Promise<SaleItem[]>;
  updateSale(saleId: number | string, updates: Partial<Sale>, items?: any[]): Promise<void>;
  deleteSale(saleId: number | string): Promise<void>;

  getSettings(): Promise<ShopSettings>;
  updateSettings(updates: Partial<ShopSettings>): Promise<void>;

  getExpenses(): Promise<Expense[]>;
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  updateExpense(id: number | string, updates: Partial<Expense>): Promise<void>;
  deleteExpense(id: number | string): Promise<void>;

  addLoginHistory(record: any): Promise<number>;
  updateLoginHistory(id: number | string, record: any): Promise<void>;
  authenticateUser(username: string, password: string): Promise<any>;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: number | string | string, updates: Partial<User>): Promise<void>;
  deleteUser(id: number | string): Promise<void>;

  exportData(): Promise<void>;
  importData(file?: File): Promise<void>;
  exportSettings(): Promise<void>;
  importSettings(file?: File): Promise<void>;
  resetPreferences(): Promise<void>;
  clearDemoData(): Promise<void>;
  resetSampleData(): Promise<void>;

  getStockAdjustments(): Promise<StockAdjustment[]>;
  addStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment>;

  getPurchaseEntries(): Promise<PurchaseEntry[]>;
  addPurchaseEntry(
    entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  ): Promise<PurchaseEntry>;

  getStockMovements(productId?: number | string): Promise<StockMovement[]>;
  addStockMovement(
    productId: number | string,
    productName: string,
    actionType: string,
    qtyBefore: number,
    qtyChanged: number,
    qtyAfter: number,
    reference?: string,
    notes?: string,
    user?: string
  ): Promise<void>;

  getInventoryAuditLogs(): Promise<InventoryAuditLog[]>;
  addInventoryAuditLog(action: string, reference: string, description: string, user?: string): Promise<void>;
  syncDatabases(): Promise<void>;
}
