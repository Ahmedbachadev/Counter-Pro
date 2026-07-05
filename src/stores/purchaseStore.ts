import { create } from 'zustand';
import inventoryService from '../services/inventoryService';
import supplierService from '../services/supplierService';
import expenseService from '../services/expenseService';
import { useInventoryStore } from './inventoryStore';
import { useSupplierStore } from './supplierStore';

export interface PurchaseOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  receivedQty: number;
  returnedQty: number;
  discount: number; // Discount per item
  tax: number; // Tax percentage or fixed per item
}

export interface PurchaseOrderReceivingLogItem {
  productId: number;
  productName: string;
  quantity: number;
}

export interface PurchaseOrderReceivingLog {
  id: string;
  receivedAt: string;
  receivedBy: string;
  items: PurchaseOrderReceivingLogItem[];
  notes?: string;
}

export interface PurchasePayment {
  id: string;
  date: string;
  method: 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Mobile Wallet' | 'Other';
  reference?: string;
  amount: number;
  notes?: string;
}

export interface PurchaseReturnItem {
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
}

export interface PurchaseReturn {
  id: string;
  returnedAt: string;
  returnedBy: string;
  items: PurchaseReturnItem[];
  reason?: string;
  totalRefundAmount: number;
}

export interface PurchaseOrder {
  id: number;
  purchaseNumber: string; // Auto-generated PO-10001
  supplierId: number;
  supplierName: string;
  purchaseDate: string;
  expectedDeliveryDate: string;
  dueDate: string; // Due date for payment
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overpaid';
  items: PurchaseOrderItem[];
  shippingCost: number;
  additionalCharges: number;
  discount: number; // Overall discount
  tax: number; // Overall tax
  notes?: string;
  totalAmount: number;
  amountPaid: number;
  totalReturnedAmount: number;
  remainingBalance: number;
  receivingHistory: PurchaseOrderReceivingLog[];
  paymentsHistory: PurchasePayment[];
  returnsHistory: PurchaseReturn[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFinancialDashboard {
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
  openPurchaseOrdersCount: number;
}

export interface OverduePayment {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  dueDate: string;
  daysOverdue: number;
  outstandingAmount: number;
}

interface PurchaseStore {
  purchaseOrders: PurchaseOrder[];
  initializeFromDatabase: () => Promise<void>;
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'purchaseNumber' | 'receivingHistory' | 'paymentsHistory' | 'returnsHistory' | 'totalReturnedAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseOrder>;
  updatePurchaseOrder: (id: number, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: number) => Promise<void>;
  duplicatePurchaseOrder: (id: number) => Promise<PurchaseOrder | null>;
  receiveInventory: (
    id: number,
    receivedItems: { productId: number; quantity: number }[],
    notes?: string
  ) => Promise<void>;
  recordPayment: (
    orderId: number,
    payment: Omit<PurchasePayment, 'id'>
  ) => Promise<void>;
  returnItems: (
    orderId: number,
    returnedItems: { productId: number; quantity: number }[],
    reason?: string
  ) => Promise<void>;
  getSupplierFinancialDashboard: (supplierId: number) => SupplierFinancialDashboard;
  getOverduePayments: () => OverduePayment[];
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  purchaseOrders: [],

  initializeFromDatabase: async () => {
    try {
      const data = localStorage.getItem('khatabook_purchase_orders');
      if (data) {
        const parsed = JSON.parse(data) as any[];
        const sanitized = parsed.map(o => ({
          ...o,
          items: o.items || [],
          receivingHistory: o.receivingHistory || [],
          paymentsHistory: o.paymentsHistory || [],
          returnsHistory: o.returnsHistory || [],
          totalReturnedAmount: Number(o.totalReturnedAmount || 0),
          amountPaid: Number(o.amountPaid || 0),
          totalAmount: Number(o.totalAmount || 0),
          remainingBalance: Number(o.remainingBalance ?? (o.totalAmount - o.amountPaid)),
          paymentStatus: o.paymentStatus || 'Unpaid',
          dueDate: o.dueDate || o.expectedDeliveryDate || o.purchaseDate
        }));
        set({ purchaseOrders: sanitized });
      } else {
        set({ purchaseOrders: [] });
      }
    } catch (error) {
      console.error('Failed to initialize purchase orders:', error);
      set({ purchaseOrders: [] });
    }
  },

  addPurchaseOrder: async (orderData) => {
    const orders = get().purchaseOrders;
    
    // Generate next PO number
    let nextNum = 10001;
    if (orders.length > 0) {
      const nums = orders.map(o => {
        const match = o.purchaseNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const purchaseNumber = `PO-${nextNum}`;
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();

    // Determine initial payment status
    let paymentStatus: PurchaseOrder['paymentStatus'] = 'Unpaid';
    if (orderData.amountPaid > 0) {
      if (orderData.amountPaid >= orderData.totalAmount) {
        paymentStatus = 'Paid';
      } else {
        paymentStatus = 'Partially Paid';
      }
    }

    const newOrder: PurchaseOrder = {
      ...orderData,
      id,
      purchaseNumber,
      paymentStatus,
      totalReturnedAmount: 0,
      receivingHistory: [],
      paymentsHistory: orderData.amountPaid > 0 ? [{
        id: `PAY-${Date.now()}`,
        date: orderData.purchaseDate,
        method: 'Cash',
        amount: orderData.amountPaid,
        notes: 'Initial payment recorded during PO creation'
      }] : [],
      returnsHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newOrder, ...orders];
    localStorage.setItem('khatabook_purchase_orders', JSON.stringify(updated));
    set({ purchaseOrders: updated });

    return newOrder;
  },

  updatePurchaseOrder: async (id, updates) => {
    const orders = get().purchaseOrders;
    const updated = orders.map(o => {
      if (o.id === id) {
        const merged = { ...o, ...updates, updatedAt: new Date().toISOString() };
        // Recalculate remaining balance
        const balance = merged.totalAmount - merged.totalReturnedAmount - merged.amountPaid;
        merged.remainingBalance = Math.max(0, balance);
        
        // Re-determine payment status
        if (merged.amountPaid === 0) {
          merged.paymentStatus = 'Unpaid';
        } else if (merged.amountPaid >= (merged.totalAmount - merged.totalReturnedAmount)) {
          merged.paymentStatus = merged.amountPaid > (merged.totalAmount - merged.totalReturnedAmount) ? 'Overpaid' : 'Paid';
        } else {
          merged.paymentStatus = 'Partially Paid';
        }
        return merged;
      }
      return o;
    });

    localStorage.setItem('khatabook_purchase_orders', JSON.stringify(updated));
    set({ purchaseOrders: updated });
  },

  deletePurchaseOrder: async (id) => {
    const orders = get().purchaseOrders;
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem('khatabook_purchase_orders', JSON.stringify(filtered));
    set({ purchaseOrders: filtered });
  },

  duplicatePurchaseOrder: async (id) => {
    const order = get().purchaseOrders.find(o => o.id === id);
    if (!order) return null;

    // Create a new PO with duplicated items, but reset histories
    const duplicatedItems = order.items.map(item => ({
      ...item,
      receivedQty: 0,
      returnedQty: 0
    }));

    return await get().addPurchaseOrder({
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      purchaseDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: order.expectedDeliveryDate,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Draft',
      items: duplicatedItems,
      shippingCost: order.shippingCost,
      additionalCharges: order.additionalCharges,
      discount: order.discount,
      tax: order.tax,
      notes: order.notes ? `Duplicated from ${order.purchaseNumber}. ${order.notes}` : `Duplicated from ${order.purchaseNumber}`,
      totalAmount: order.totalAmount,
      amountPaid: 0,
      remainingBalance: order.totalAmount
    });
  },

  receiveInventory: async (orderId, receivedItems, notes) => {
    const orders = get().purchaseOrders;
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Purchase Order not found');

    const products = useInventoryStore.getState().products;

    const logItems: PurchaseOrderReceivingLogItem[] = [];
    const updatedItems = order.items.map(item => {
      const match = receivedItems.find(r => r.productId === item.productId);
      if (match && match.quantity > 0) {
        logItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: match.quantity
        });
        return {
          ...item,
          receivedQty: item.receivedQty + match.quantity
        };
      }
      return item;
    });

    if (logItems.length === 0) {
      return; // Nothing received
    }

    // Apply stock increases
    for (const logItem of logItems) {
      const product = products.find(p => p.id === logItem.productId);
      const qtyBefore = product ? product.stock : 0;
      const qtyAfter = qtyBefore + logItem.quantity;

      // 1. Update product stock in database
      await inventoryService.updateProductStock(logItem.productId, logItem.quantity);

      // 2. Record stock movement
      await inventoryService.addStockMovement(
        logItem.productId,
        logItem.productName,
        'Purchase Order',
        qtyBefore,
        logItem.quantity,
        qtyAfter,
        order.purchaseNumber,
        notes || `Received from Purchase Order ${order.purchaseNumber}`
      );

      // 3. Record stock purchase in supplier history
      const itemConfig = order.items.find(i => i.productId === logItem.productId);
      const costPrice = itemConfig ? itemConfig.costPrice : (product ? product.cost : 0);
      await supplierService.addStockPurchase({
        productId: logItem.productId,
        productName: logItem.productName,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        quantity: logItem.quantity,
        costPrice: costPrice,
        totalCost: logItem.quantity * costPrice
      });
    }

    // 4. Update audit logs
    await inventoryService.addInventoryAuditLog(
      'Purchase Order Received',
      order.purchaseNumber,
      `Received items from Purchase Order ${order.purchaseNumber}. Items: ${logItems.map(i => `${i.productName} (Qty: ${i.quantity})`).join(', ')}`
    );

    // Create receiving log entry
    const newLog: PurchaseOrderReceivingLog = {
      id: `REC-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      receivedBy: 'Admin',
      items: logItems,
      notes: notes
    };

    // Calculate new status
    const allFullyReceived = updatedItems.every(item => item.receivedQty >= item.quantity);
    const anyReceived = updatedItems.some(item => item.receivedQty > 0);
    const status = allFullyReceived ? 'Received' : (anyReceived ? 'Partially Received' : 'Ordered');

    // Update PO details
    const updatedOrder: PurchaseOrder = {
      ...order,
      status,
      items: updatedItems,
      receivingHistory: [...order.receivingHistory, newLog],
      updatedAt: new Date().toISOString()
    };

    const nextOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    localStorage.setItem('khatabook_purchase_orders', JSON.stringify(nextOrders));
    set({ purchaseOrders: nextOrders });

    // Refresh inventory and suppliers stores
    await useInventoryStore.getState().initializeFromDatabase();
    await useSupplierStore.getState().initializeFromDatabase();
  },

  recordPayment: async (orderId, paymentData) => {
    const orders = get().purchaseOrders;
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Purchase Order not found');

    const paymentId = `PAY-${Date.now()}`;
    const newPayment: PurchasePayment = {
      ...paymentData,
      id: paymentId
    };

    const newAmountPaid = order.amountPaid + paymentData.amount;
    const netTotal = order.totalAmount - order.totalReturnedAmount;
    const newBalance = Math.max(0, netTotal - newAmountPaid);

    let paymentStatus: PurchaseOrder['paymentStatus'] = 'Partially Paid';
    if (newAmountPaid === 0) {
      paymentStatus = 'Unpaid';
    } else if (newAmountPaid >= netTotal) {
      paymentStatus = newAmountPaid > netTotal ? 'Overpaid' : 'Paid';
    }

    const updatedOrder: PurchaseOrder = {
      ...order,
      amountPaid: newAmountPaid,
      remainingBalance: newBalance,
      paymentStatus,
      paymentsHistory: [...order.paymentsHistory, newPayment],
      updatedAt: new Date().toISOString()
    };

    // Record payment in Expense logs for tracing
    try {
      await expenseService.addExpense({
        description: `Supplier Payment against ${order.purchaseNumber}`,
        category: 'Supplier Payment',
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        reference: paymentData.reference || undefined,
        notes: paymentData.notes || `Paid to supplier: ${order.supplierName}`
      });
    } catch (e) {
      console.error('Failed to auto-record supplier payment as expense:', e);
    }

    // Add inventory audit log
    await inventoryService.addInventoryAuditLog(
      'Supplier Payment',
      order.purchaseNumber,
      `Paid Rs. ${paymentData.amount} via ${paymentData.method} reference: ${paymentData.reference || 'None'}`
    );

    const nextOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    localStorage.setItem('khatabook_purchase_orders', JSON.stringify(nextOrders));
    set({ purchaseOrders: nextOrders });

    // Refresh store contexts
    await useSupplierStore.getState().initializeFromDatabase();
  },

  returnItems: async (orderId, returnedItems, reason) => {
    const orders = get().purchaseOrders;
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Purchase Order not found');

    const products = useInventoryStore.getState().products;
    const logItems: PurchaseReturnItem[] = [];

    const updatedItems = order.items.map(item => {
      const match = returnedItems.find(r => r.productId === item.productId);
      if (match && match.quantity > 0) {
        const qtyToReturn = Math.min(item.receivedQty - item.returnedQty, match.quantity);
        if (qtyToReturn > 0) {
          logItems.push({
            productId: item.productId,
            productName: item.productName,
            quantity: qtyToReturn,
            costPrice: item.costPrice
          });
          return {
            ...item,
            returnedQty: item.returnedQty + qtyToReturn
          };
        }
      }
      return item;
    });

    if (logItems.length === 0) {
      throw new Error('No valid items to return (cannot return more than what has been received)');
    }

    let batchRefundAmount = 0;
    // Process inventory reduction for returned items
    for (const logItem of logItems) {
      const product = products.find(p => p.id === logItem.productId);
      const qtyBefore = product ? product.stock : 0;
      const qtyAfter = Math.max(0, qtyBefore - logItem.quantity);

      // 1. Update product stock (decrease stock)
      await inventoryService.updateProductStock(logItem.productId, -logItem.quantity);

      // 2. Record stock movement
      await inventoryService.addStockMovement(
        logItem.productId,
        logItem.productName,
        'Purchase Return',
        qtyBefore,
        -logItem.quantity,
        qtyAfter,
        order.purchaseNumber,
        reason || `Returned items from Purchase Order ${order.purchaseNumber}`
      );

      batchRefundAmount += logItem.quantity * logItem.costPrice;
    }

    const totalReturnedAmount = order.totalReturnedAmount + batchRefundAmount;
    const netTotal = order.totalAmount - totalReturnedAmount;
    const newRemainingBalance = Math.max(0, netTotal - order.amountPaid);

    let paymentStatus: PurchaseOrder['paymentStatus'] = 'Unpaid';
    if (order.amountPaid > 0) {
      if (order.amountPaid >= netTotal) {
        paymentStatus = order.amountPaid > netTotal ? 'Overpaid' : 'Paid';
      } else {
        paymentStatus = 'Partially Paid';
      }
    }

    const newReturnLog: PurchaseReturn = {
      id: `RET-${Date.now()}`,
      returnedAt: new Date().toISOString(),
      returnedBy: 'Admin',
      items: logItems,
      reason,
      totalRefundAmount: batchRefundAmount
    };

    // Update audit logs
    await inventoryService.addInventoryAuditLog(
      'Purchase Return',
      order.purchaseNumber,
      `Returned items worth Rs. ${batchRefundAmount} back to supplier. Reason: ${reason || 'None'}`
    );

    const updatedOrder: PurchaseOrder = {
      ...order,
      items: updatedItems,
      totalReturnedAmount,
      remainingBalance: newRemainingBalance,
      paymentStatus,
      returnsHistory: [...order.returnsHistory, newReturnLog],
      updatedAt: new Date().toISOString()
    };

    const nextOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    localStorage.setItem('khatabook_purchase_orders', JSON.stringify(nextOrders));
    set({ purchaseOrders: nextOrders });

    // Refresh dependencies
    await useInventoryStore.getState().initializeFromDatabase();
    await useSupplierStore.getState().initializeFromDatabase();
  },

  getSupplierFinancialDashboard: (supplierId) => {
    const orders = get().purchaseOrders.filter(
      o => o.supplierId === supplierId && o.status !== 'Cancelled'
    );

    const totalPurchases = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = orders.reduce((sum, o) => sum + o.amountPaid, 0);
    const outstandingBalance = orders.reduce((sum, o) => sum + o.remainingBalance, 0);
    const openPurchaseOrdersCount = orders.filter(
      o => o.status !== 'Received' && o.status !== 'Cancelled'
    ).length;

    // Last Purchase Date
    let lastPurchaseDate: string | null = null;
    if (orders.length > 0) {
      const dates = orders.map(o => new Date(o.purchaseDate).getTime());
      const maxDate = Math.max(...dates);
      lastPurchaseDate = new Date(maxDate).toISOString().split('T')[0];
    }

    // Last Payment Date
    let lastPaymentDate: string | null = null;
    let maxPaymentTime = 0;
    orders.forEach(o => {
      o.paymentsHistory.forEach(p => {
        const time = new Date(p.date).getTime();
        if (time > maxPaymentTime) {
          maxPaymentTime = time;
          lastPaymentDate = p.date;
        }
      });
    });

    return {
      totalPurchases,
      totalPaid,
      outstandingBalance,
      lastPurchaseDate,
      lastPaymentDate,
      openPurchaseOrdersCount
    };
  },

  getOverduePayments: () => {
    const today = new Date().setHours(0, 0, 0, 0);
    return get()
      .purchaseOrders.filter(o => {
        if (o.status === 'Cancelled' || o.paymentStatus === 'Paid' || o.remainingBalance <= 0) return false;
        const dueTime = new Date(o.dueDate).getTime();
        return dueTime < today;
      })
      .map(o => {
        const dueTime = new Date(o.dueDate).getTime();
        const diffDays = Math.ceil((today - dueTime) / (1000 * 60 * 60 * 24));
        return {
          id: o.id,
          purchaseNumber: o.purchaseNumber,
          supplierId: o.supplierId,
          supplierName: o.supplierName,
          dueDate: o.dueDate,
          daysOverdue: diffDays,
          outstandingAmount: o.remainingBalance
        };
      });
  }
}));
