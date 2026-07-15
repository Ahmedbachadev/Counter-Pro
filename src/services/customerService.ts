import { customerRepository } from '../backend/repositories/CustomerRepository';
import { getProvider } from '../backend/providers';
import type {
  Customer,
  CustomerPayment,
  CustomerLoyaltyHistory
} from '../backend/types';

// Offline-first: Electron always reads/writes SQLite. Sync engine handles Supabase.
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    return isElectron ? customerRepository.getCustomers() : getProvider().getCustomers();
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return isElectron ? customerRepository.addCustomer(customer) : getProvider().addCustomer(customer);
  },

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<void> {
    return isElectron ? customerRepository.updateCustomer(id, updates) : getProvider().updateCustomer(id, updates);
  },

  async deleteCustomer(id: number): Promise<void> {
    return isElectron ? customerRepository.deleteCustomer(id) : getProvider().deleteCustomer(id);
  },

  async getCustomerPayments(customerId: number): Promise<CustomerPayment[]> {
    return isElectron ? customerRepository.getCustomerPayments(customerId) : getProvider().getCustomerPayments(customerId);
  },

  async addCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    return isElectron ? customerRepository.addCustomerPayment(payment) : getProvider().addCustomerPayment(payment);
  },

  async getCustomerLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyHistory[]> {
    return isElectron ? customerRepository.getCustomerLoyaltyHistory(customerId) : getProvider().getCustomerLoyaltyHistory(customerId);
  },

  async addCustomerLoyaltyHistory(history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>): Promise<CustomerLoyaltyHistory> {
    return isElectron ? customerRepository.addCustomerLoyaltyHistory(history) : getProvider().addCustomerLoyaltyHistory(history);
  },

  async updateCustomerBalance(id: number, amount: number): Promise<void> {
    return isElectron ? customerRepository.updateCustomerBalance(id, amount) : getProvider().updateCustomerBalance(id, amount);
  },

  async updateCustomerLoyaltyPoints(id: number, pointsChange: number): Promise<void> {
    return isElectron ? customerRepository.updateCustomerLoyaltyPoints(id, pointsChange) : getProvider().updateCustomerLoyaltyPoints(id, pointsChange);
  }
};

export default customerService;
