import { getProvider } from '../providers';
import type { Customer, CustomerPayment, CustomerLoyaltyHistory } from '../types';

export const customerRepository = {
  async getCustomers(): Promise<Customer[]> {
    return getProvider().getCustomers();
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return getProvider().addCustomer(customer);
  },

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<void> {
    return getProvider().updateCustomer(id, updates);
  },

  async deleteCustomer(id: number): Promise<void> {
    return getProvider().deleteCustomer(id);
  },

  async getCustomerPayments(customerId: number): Promise<CustomerPayment[]> {
    return getProvider().getCustomerPayments(customerId);
  },

  async addCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    return getProvider().addCustomerPayment(payment);
  },

  async getCustomerLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyHistory[]> {
    return getProvider().getCustomerLoyaltyHistory(customerId);
  },

  async addCustomerLoyaltyHistory(history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>): Promise<CustomerLoyaltyHistory> {
    return getProvider().addCustomerLoyaltyHistory(history);
  },

  async updateCustomerBalance(id: number, amount: number): Promise<void> {
    return getProvider().updateCustomerBalance(id, amount);
  },

  async updateCustomerLoyaltyPoints(id: number, pointsChange: number): Promise<void> {
    return getProvider().updateCustomerLoyaltyPoints(id, pointsChange);
  }
};

export default customerRepository;
