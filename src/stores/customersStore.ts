import { create } from 'zustand';
import customerService from '../services/customerService';
import { customerRepository } from '../backend/repositories/CustomerRepository';
import type { Customer, CustomerPayment, CustomerLoyaltyHistory } from '../backend/types';

export type { Customer, CustomerPayment, CustomerLoyaltyHistory };

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  initializeFromDatabase: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  getCustomerById: (id: number) => Customer | undefined;
  updateCustomerPendingAmount: (id: number, amount: number) => Promise<void>;
  updateCustomerLoyaltyPoints: (id: number, pointsChange: number) => Promise<void>;
  getCustomerPayments: (customerId: number) => Promise<CustomerPayment[]>;
  addCustomerPayment: (payment: Omit<CustomerPayment, 'id' | 'createdAt'>) => Promise<CustomerPayment>;
  getCustomerLoyaltyHistory: (customerId: number) => Promise<CustomerLoyaltyHistory[]>;
  addCustomerLoyaltyHistory: (history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>) => Promise<CustomerLoyaltyHistory>;
  // Pagination
  page: number;
  hasMore: boolean;
  totalCount: number;
  loadMoreCustomers: (page?: number, limit?: number, reset?: boolean) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  totalCount: 0,

  initializeFromDatabase: async () => {
    // Legacy method - just load first page instead of ALL
    await get().loadMoreCustomers(1, 50, true);
  },

  loadMoreCustomers: async (page = 1, limit = 50, reset = false) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      // Use the paginated endpoint
      const result = await customerRepository.paginate(page, limit);
      
      set((state) => ({
        customers: reset ? result.data : [...state.customers, ...result.data],
        page: result.page,
        hasMore: result.page < result.totalPages,
        totalCount: result.total,
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to load customers', isLoading: false });
      console.error('Error loading customers:', error);
    }
  },

  addCustomer: async (customer) => {
    try {
      const newCustomer = await customerService.addCustomer(customer);
      set((state) => ({
        customers: [...state.customers, newCustomer]
      }));
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      await customerService.updateCustomer(id, updates);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      await customerService.deleteCustomer(id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  updateCustomerPendingAmount: async (id, amount) => {
    try {
      await customerService.updateCustomerBalance(id, amount);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, pendingAmount: c.pendingAmount + amount } : c
        )
      }));
    } catch (error) {
      console.error('Error updating customer balance:', error);
      throw error;
    }
  },

  updateCustomerLoyaltyPoints: async (id, pointsChange) => {
    try {
      await customerService.updateCustomerLoyaltyPoints(id, pointsChange);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + pointsChange } : c
        )
      }));
    } catch (error) {
      console.error('Error updating customer loyalty points:', error);
      throw error;
    }
  },

  getCustomerPayments: async (customerId) => {
    try {
      return await customerService.getCustomerPayments(customerId);
    } catch (error) {
      console.error('Error loading customer payments:', error);
      return [];
    }
  },

  addCustomerPayment: async (payment) => {
    try {
      const newPayment = await customerService.addCustomerPayment(payment);
      // Automatically adjust outstanding balance
      await customerService.updateCustomerBalance(payment.customerId, -payment.amount);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === payment.customerId ? { ...c, pendingAmount: c.pendingAmount - payment.amount } : c
        )
      }));
      return newPayment;
    } catch (error) {
      console.error('Error adding customer payment:', error);
      throw error;
    }
  },

  getCustomerLoyaltyHistory: async (customerId) => {
    try {
      return await customerService.getCustomerLoyaltyHistory(customerId);
    } catch (error) {
      console.error('Error loading customer loyalty history:', error);
      return [];
    }
  },

  addCustomerLoyaltyHistory: async (history) => {
    try {
      const newHistory = await customerService.addCustomerLoyaltyHistory(history);
      // Update customer loyalty points locally
      await customerService.updateCustomerLoyaltyPoints(history.customerId, history.points);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === history.customerId ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + history.points } : c
        )
      }));
      return newHistory;
    } catch (error) {
      console.error('Error adding loyalty history:', error);
      throw error;
    }
  }
}));