import { create } from 'zustand';
import salesService from '../services/salesService';
import { Product } from './inventoryStore';
import { Customer } from './customersStore';
import { useCustomerStore } from './customersStore';

export interface SaleItem {
  product: Product;
  quantity: number;
  subtotal: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  discountReason?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'bank_transfer' | 'mobile_wallet' | 'other';

export interface SplitPaymentItem {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  total: number;
  tax: number;
  discount: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  discountReason?: string;
  notes?: string;
  finalAmount: number;
  amountPaid: number;
  change: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  payments?: SplitPaymentItem[];
  paymentStatus?: 'Fully Paid' | 'Partially Paid' | 'Credit Sale';
  customerId?: number;
  cashierId: string;
  createdAt: Date;
}

interface POSStore {
  sales: Sale[];
  cart: SaleItem[];
  selectedCustomer: Customer | null;
  initializeFromDatabase: () => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (saleId: number, updates: Partial<Sale>, items?: SaleItem[]) => Promise<void>;
  deleteSale: (saleId: number) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  selectCustomer: (customer: Customer | null) => void;
  updateCartItemDiscount: (productId: string, discountType: 'percentage' | 'fixed' | null, discountValue: number, discountReason?: string) => void;
  updateCartItemNote: (productId: string, notes: string) => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  sales: [],
  cart: [],
  selectedCustomer: null,

  initializeFromDatabase: async () => {
    try {
      const sales = await salesService.getSales();
      set({ sales: sales as any[] });
    } catch (error) {
      console.error('Failed to initialize POS database:', error);
    }
  },

  addSale: async (saleData) => {
    try {
      await salesService.addSale(saleData as any, saleData.items as any);
      
      // If there's an outstanding balance and a valid customer, automatically add it to their credit ledger
      if (saleData.dueAmount > 0 && saleData.customerId) {
        await useCustomerStore.getState().updateCustomerPendingAmount(saleData.customerId, saleData.dueAmount);
      }

      const sales = await salesService.getSales();
      set({ sales: sales as any[] });

      // Automatically calculate loyalty points from the completed sale
      if (saleData.customerId) {
        const latestSale = sales[0]; // sales are DESC
        const saleIdStr = latestSale ? `SALE-${latestSale.id}` : 'SALE-NEW';
        
        const config = { pointsPerAmount: 100, enabled: true };
        try {
          const saved = localStorage.getItem('khatabook_loyalty_config');
          if (saved) {
            Object.assign(config, JSON.parse(saved));
          }
        } catch (e) {}

        if (config.enabled) {
          const pointsEarned = Math.floor(saleData.finalAmount / config.pointsPerAmount);
          if (pointsEarned > 0) {
            await useCustomerStore.getState().addCustomerLoyaltyHistory({
              customerId: saleData.customerId,
              points: pointsEarned,
              transactionType: 'earn',
              referenceType: 'sale',
              referenceId: saleIdStr,
              notes: `Earned points from purchase invoice #${latestSale?.id || ''}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to add sale record:', error);
      throw error;
    }
  },

  addToCart: (product, quantity = 1) => {
    set(state => {
      const existingIdx = state.cart.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        return {
          cart: state.cart.map((item, i) =>
            i === existingIdx
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal: (item.quantity + quantity) * product.price
                }
              : item
          )
        };
      } else {
        return {
          cart: [...state.cart, { product, quantity, subtotal: quantity * product.price }]
        };
      }
    });
  },

  updateCartItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    set(state => ({
      cart: state.cart.map(item =>
        item.product.id.toString() === productId.toString() || item.product.id === parseInt(productId, 10)
          ? { ...item, quantity, subtotal: quantity * item.product.price }
          : item
      )
    }));
  },

  removeFromCart: (productId) => {
    set(state => ({
      cart: state.cart.filter(item => item.product.id.toString() !== productId.toString() && item.product.id !== parseInt(productId, 10))
    }));
  },

  clearCart: () => {
    set({ cart: [], selectedCustomer: null });
  },

  selectCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  updateCartItemDiscount: (productId, discountType, discountValue, discountReason) => {
    set(state => ({
      cart: state.cart.map(item =>
        item.product.id.toString() === productId.toString() || item.product.id === parseInt(productId, 10)
          ? { ...item, discountType, discountValue, discountReason }
          : item
      )
    }));
  },

  updateCartItemNote: (productId, notes) => {
    set(state => ({
      cart: state.cart.map(item =>
        item.product.id.toString() === productId.toString() || item.product.id === parseInt(productId, 10)
          ? { ...item, notes }
          : item
      )
    }));
  },

  updateSale: async (saleId, updates, items) => {
    try {
      await salesService.updateSale(saleId, updates, items);
      const sales = await salesService.getSales();
      set({ sales: sales as any[] });
    } catch (error) {
      console.error('Failed to update sale:', error);
      throw error;
    }
  },

  deleteSale: async (saleId) => {
    try {
      await salesService.deleteSale(saleId);
      const sales = await salesService.getSales();
      set({ sales: sales as any[] });
    } catch (error) {
      console.error('Failed to delete sale:', error);
      throw error;
    }
  }
}));