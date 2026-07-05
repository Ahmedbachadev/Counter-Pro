import { create } from 'zustand';
import { useInventoryStore } from './inventoryStore';
import { useCustomerStore } from './customersStore';
import { usePOSStore } from './posStore';
import { useSupplierStore } from './supplierStore';
import { useExpensesStore } from './expensesStore';
import { usePurchaseStore } from './purchaseStore';
import { useReturnsStore } from './returnsStore';
import { useSettingsStore } from './settingsStore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  module: 'inventory' | 'sales' | 'customers' | 'suppliers' | 'expenses' | 'system';
  createdAt: string;
  read: boolean;
  actionType?: 'view_product' | 'view_customer' | 'view_supplier' | 'view_sale' | 'view_purchase' | 'view_expense' | 'view_settings';
  actionPayload?: any;
}

interface NotificationsState {
  manualNotifications: Notification[];
  readIds: string[];
  deletedIds: string[];
  
  // Actions
  initializeNotifications: () => void;
  getNotifications: () => Notification[];
  addManualNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markSelectedRead: (ids: string[]) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  deleteSelected: (ids: string[]) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => {
  return {
    manualNotifications: [],
    readIds: [],
    deletedIds: [],

    initializeNotifications: () => {
      try {
        const manual = localStorage.getItem('khatabook_manual_notifications');
        const read = localStorage.getItem('khatabook_read_notification_ids');
        const deleted = localStorage.getItem('khatabook_deleted_notification_ids');
        
        set({
          manualNotifications: manual ? JSON.parse(manual) : [],
          readIds: read ? JSON.parse(read) : [],
          deletedIds: deleted ? JSON.parse(deleted) : [],
        });
      } catch (e) {
        console.error('Failed to initialize notifications store:', e);
      }
    },

    getNotifications: () => {
      const { manualNotifications, readIds, deletedIds } = get();
      const settings = useSettingsStore.getState().shopSettings;

      // 1. Gather all dynamic business notifications
      const dynamicNotifications: Notification[] = [];

      // --- INVENTORY ---
      if (settings.lowStockAlerts !== false) {
        const products = useInventoryStore.getState().products || [];
        const lowStockThreshold = settings.lowStockThreshold ?? 5;
        
        products.forEach(product => {
          if (product.stock === 0) {
            dynamicNotifications.push({
              id: `out-of-stock-${product.id}`,
              title: `Out of Stock: ${product.name}`,
              message: `Product "${product.name}" is completely out of stock. Please restock soon.`,
              type: 'error',
              module: 'inventory',
              createdAt: product.updatedAt || product.createdAt || new Date().toISOString(),
              read: readIds.includes(`out-of-stock-${product.id}`),
              actionType: 'view_product',
              actionPayload: { productId: product.id }
            });
          } else if (product.stock <= (product.minStock || lowStockThreshold)) {
            dynamicNotifications.push({
              id: `low-stock-${product.id}`,
              title: `Low Stock Alert: ${product.name}`,
              message: `Product "${product.name}" has only ${product.stock} units remaining.`,
              type: 'warning',
              module: 'inventory',
              createdAt: product.updatedAt || product.createdAt || new Date().toISOString(),
              read: readIds.includes(`low-stock-${product.id}`),
              actionType: 'view_product',
              actionPayload: { productId: product.id }
            });
          } else if (product.stock > 150 && product.stock > (product.initialStock || 50) * 1.8) {
            dynamicNotifications.push({
              id: `overstock-${product.id}`,
              title: `Overstock Warning: ${product.name}`,
              message: `Product "${product.name}" is overstocked with ${product.stock} units, which exceeds normal demand levels.`,
              type: 'info',
              module: 'inventory',
              createdAt: product.updatedAt || product.createdAt || new Date().toISOString(),
              read: readIds.includes(`overstock-${product.id}`),
              actionType: 'view_product',
              actionPayload: { productId: product.id }
            });
          }
        });
      }

      // --- SALES & RETURNS ---
      if (settings.salesAlerts !== false) {
        const sales = usePOSStore.getState().sales || [];
        sales.forEach(sale => {
          // Large Sale completed
          if (sale.finalAmount >= 20000) {
            dynamicNotifications.push({
              id: `large-sale-${sale.id}`,
              title: `Large Sale Completed`,
              message: `A large sale of ${sale.finalAmount.toLocaleString()} PKR (ID: #${sale.id}) has been completed.`,
              type: 'success',
              module: 'sales',
              createdAt: sale.createdAt instanceof Date ? sale.createdAt.toISOString() : new Date(sale.createdAt).toISOString(),
              read: readIds.includes(`large-sale-${sale.id}`),
              actionType: 'view_sale',
              actionPayload: { saleId: sale.id }
            });
          }
        });

        // Returns and Exchanges
        const returns = useReturnsStore.getState().returns || [];
        returns.forEach(ret => {
          if (ret.exchangeItems && ret.exchangeItems.length > 0) {
            dynamicNotifications.push({
              id: `exchange-${ret.id}`,
              title: `Exchange Completed`,
              message: `Exchange transaction of ${ret.exchangeAmount.toLocaleString()} PKR (Return ID: ${ret.id}) processed successfully.`,
              type: 'success',
              module: 'sales',
              createdAt: new Date(ret.createdAt).toISOString(),
              read: readIds.includes(`exchange-${ret.id}`),
              actionType: 'view_sale',
              actionPayload: { saleId: ret.originalSaleId }
            });
          } else if (ret.refundAmount > 0) {
            dynamicNotifications.push({
              id: `refund-${ret.id}`,
              title: `Refund Processed`,
              message: `Refund of ${ret.refundAmount.toLocaleString()} PKR completed for sale #${ret.originalSaleId}.`,
              type: 'info',
              module: 'sales',
              createdAt: new Date(ret.createdAt).toISOString(),
              read: readIds.includes(`refund-${ret.id}`),
              actionType: 'view_sale',
              actionPayload: { saleId: ret.originalSaleId }
            });
          }
        });
      }

      // --- CUSTOMERS ---
      if (settings.customerBalanceAlerts !== false) {
        const customers = useCustomerStore.getState().customers || [];
        customers.forEach(customer => {
          // Outstanding balance alert
          if (customer.pendingAmount >= 10000) {
            dynamicNotifications.push({
              id: `customer-balance-${customer.id}`,
              title: `Outstanding Balance: ${customer.name}`,
              message: `Customer "${customer.name}" has an outstanding pending amount of ${customer.pendingAmount.toLocaleString()} PKR.`,
              type: 'warning',
              module: 'customers',
              createdAt: customer.createdAt instanceof Date ? customer.createdAt.toISOString() : new Date(customer.createdAt).toISOString(),
              read: readIds.includes(`customer-balance-${customer.id}`),
              actionType: 'view_customer',
              actionPayload: { customerId: customer.id }
            });
          }
          // New customer added (last 30 days)
          const createdTime = customer.createdAt instanceof Date ? customer.createdAt.getTime() : new Date(customer.createdAt).getTime();
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          if (createdTime > thirtyDaysAgo) {
            dynamicNotifications.push({
              id: `new-customer-${customer.id}`,
              title: `New Customer Added`,
              message: `Customer "${customer.name}" was registered under Counter Pro.`,
              type: 'info',
              module: 'customers',
              createdAt: customer.createdAt instanceof Date ? customer.createdAt.toISOString() : new Date(customer.createdAt).toISOString(),
              read: readIds.includes(`new-customer-${customer.id}`),
              actionType: 'view_customer',
              actionPayload: { customerId: customer.id }
            });
          }
        });
      }

      // --- SUPPLIERS & PURCHASES ---
      if (settings.supplierPaymentAlerts !== false) {
        const suppliers = useSupplierStore.getState().suppliers || [];
        suppliers.forEach(supplier => {
          if (supplier.outstandingBalance >= 20000) {
            dynamicNotifications.push({
              id: `supplier-payment-${supplier.id}`,
              title: `Outstanding Supplier Payment`,
              message: `Outstanding balance of ${supplier.outstandingBalance.toLocaleString()} PKR is due for "${supplier.name}".`,
              type: 'warning',
              module: 'suppliers',
              createdAt: supplier.updatedAt || supplier.createdAt || new Date().toISOString(),
              read: readIds.includes(`supplier-payment-${supplier.id}`),
              actionType: 'view_supplier',
              actionPayload: { supplierId: supplier.id }
            });
          }
        });
      }

      if (settings.purchaseAlerts !== false) {
        const purchaseOrders = usePurchaseStore.getState().purchaseOrders || [];
        purchaseOrders.forEach(order => {
          if (order.status === 'Received' || order.status === 'Partially Received') {
            dynamicNotifications.push({
              id: `purchase-received-${order.id}`,
              title: `Purchase Order Received`,
              message: `Purchase Order ${order.purchaseNumber} from "${order.supplierName}" has been updated to "${order.status}".`,
              type: 'success',
              module: 'suppliers',
              createdAt: order.updatedAt || order.createdAt || new Date().toISOString(),
              read: readIds.includes(`purchase-received-${order.id}`),
              actionType: 'view_purchase',
              actionPayload: { purchaseId: order.id }
            });
          }
        });
      }

      // --- EXPENSES ---
      const expenses = useExpensesStore.getState().expenses || [];
      expenses.forEach(expense => {
        if (expense.amount >= 10000) {
          dynamicNotifications.push({
            id: `large-expense-${expense.id}`,
            title: `Large Expense Recorded`,
            message: `An expense of ${expense.amount.toLocaleString()} PKR was logged under category "${expense.category}".`,
            type: 'warning',
            module: 'expenses',
            createdAt: expense.createdAt || new Date().toISOString(),
            read: readIds.includes(`large-expense-${expense.id}`),
            actionType: 'view_expense',
            actionPayload: { expenseId: expense.id }
          });
        }
      });

      // 2. Combine with manual/system notifications
      const combined = [...dynamicNotifications];
      
      if (settings.systemNotifications !== false) {
        manualNotifications.forEach(notif => {
          combined.push({
            ...notif,
            read: readIds.includes(notif.id)
          });
        });
      }

      // 3. Filter out deleted notifications and sort by date descending
      return combined
        .filter(notif => !deletedIds.includes(notif.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    addManualNotification: (notification) => {
      const { manualNotifications } = get();
      const newNotif: Notification = {
        ...notification,
        id: `sys-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        read: false
      };

      const updated = [newNotif, ...manualNotifications];
      localStorage.setItem('khatabook_manual_notifications', JSON.stringify(updated));
      set({ manualNotifications: updated });
    },

    markAsRead: (id) => {
      const { readIds } = get();
      if (!readIds.includes(id)) {
        const updated = [...readIds, id];
        localStorage.setItem('khatabook_read_notification_ids', JSON.stringify(updated));
        set({ readIds: updated });
      }
    },

    markSelectedRead: (ids) => {
      const { readIds } = get();
      const updated = [...readIds];
      ids.forEach(id => {
        if (!updated.includes(id)) {
          updated.push(id);
        }
      });
      localStorage.setItem('khatabook_read_notification_ids', JSON.stringify(updated));
      set({ readIds: updated });
    },

    markAllRead: () => {
      const allNotifs = get().getNotifications();
      const ids = allNotifs.map(n => n.id);
      localStorage.setItem('khatabook_read_notification_ids', JSON.stringify(ids));
      set({ readIds: ids });
    },

    deleteNotification: (id) => {
      const { deletedIds } = get();
      if (!deletedIds.includes(id)) {
        const updated = [...deletedIds, id];
        localStorage.setItem('khatabook_deleted_notification_ids', JSON.stringify(updated));
        set({ deletedIds: updated });
      }
    },

    deleteSelected: (ids) => {
      const { deletedIds } = get();
      const updated = [...deletedIds];
      ids.forEach(id => {
        if (!updated.includes(id)) {
          updated.push(id);
        }
      });
      localStorage.setItem('khatabook_deleted_notification_ids', JSON.stringify(updated));
      set({ deletedIds: updated });
    },

    clearAll: () => {
      const allNotifs = get().getNotifications();
      const ids = allNotifs.map(n => n.id);
      const { deletedIds } = get();
      const updated = [...new Set([...deletedIds, ...ids])];
      localStorage.setItem('khatabook_deleted_notification_ids', JSON.stringify(updated));
      set({ deletedIds: updated });
    }
  };
});
