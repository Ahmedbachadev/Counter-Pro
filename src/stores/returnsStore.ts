import { create } from 'zustand';
import { inventoryService } from '../services/inventoryService';
import { useInventoryStore } from './inventoryStore';
import { useCustomerStore } from './customersStore';
import { usePOSStore } from './posStore';

export interface ReturnItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  reason: string;
  condition: 'Resellable' | 'Damaged' | 'Expired' | 'Other';
}

export interface ExchangeItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface ReturnRecord {
  id: string;
  originalSaleId: number;
  customerId?: number;
  customerName?: string;
  items: ReturnItem[];
  exchangeItems: ExchangeItem[];
  refundAmount: number;
  exchangeAmount: number;
  netRefund: number;
  paymentMethod: string;
  cashierId: string;
  notes?: string;
  createdAt: string;
}

interface ReturnsStoreState {
  returns: ReturnRecord[];
  initializeReturns: () => void;
  addReturn: (record: Omit<ReturnRecord, 'id' | 'createdAt'>) => Promise<ReturnRecord>;
}

export const useReturnsStore = create<ReturnsStoreState>((set, get) => ({
  returns: [],

  initializeReturns: () => {
    try {
      const data = localStorage.getItem('khatabook_returns_records');
      if (data) {
        set({ returns: JSON.parse(data) });
      }
    } catch (e) {
      console.error('Failed to load returns records:', e);
    }
  },

  addReturn: async (recordData) => {
    const id = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRecord: ReturnRecord = {
      ...recordData,
      id,
      createdAt: new Date().toISOString(),
    };

    // 1. Save return record to localStorage
    const current = get().returns;
    const updated = [newRecord, ...current];
    localStorage.setItem('khatabook_returns_records', JSON.stringify(updated));
    set({ returns: updated });

    // 2. Adjust Inventory stock based on item condition
    for (const item of newRecord.items) {
      if (item.condition === 'Resellable') {
        // Resellable items are added back to stock.
        await inventoryService.updateProductStock(item.productId, item.quantity);
      } else {
        // Damaged or expired items should not increase sellable stock, track separately.
        console.log(`Return item: ${item.productName} has condition ${item.condition}. Not restocked.`);
      }
    }

    // Process exchanges (stock reduction)
    for (const item of newRecord.exchangeItems) {
      await inventoryService.updateProductStock(item.productId, -item.quantity);
    }

    // Reload inventory store
    await useInventoryStore.getState().initializeFromDatabase();

    // 3. Update customer outstanding balance or store credit if credit payment method is used
    if (newRecord.customerId) {
      const customerStore = useCustomerStore.getState();
      
      // If paymentMethod is credit, adjust client credit balance
      if (newRecord.paymentMethod === 'credit') {
        // refund reduces pending amount (pending balance)
        await customerStore.updateCustomerPendingAmount(newRecord.customerId, -newRecord.netRefund);
      }

      // Refresh customer store
      await customerStore.initializeFromDatabase();
    }

    // 4. Refresh POS sales so that we have clean and updated lists
    await usePOSStore.getState().initializeFromDatabase();

    return newRecord;
  }
}));
