import { customerRepository } from '../backend/repositories/CustomerRepository';
import type {
  Customer,
  CustomerPayment,
  CustomerLoyaltyHistory
} from '../backend/types';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    return customerRepository.getCustomers();
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return customerRepository.addCustomer(customer);
  },

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<void> {
    return customerRepository.updateCustomer(id, updates);
  },

  async deleteCustomer(id: number): Promise<void> {
    return customerRepository.deleteCustomer(id);
  },

  async getCustomerPayments(customerId: number): Promise<CustomerPayment[]> {
    return customerRepository.getCustomerPayments(customerId);
  },

  async addCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    return customerRepository.addCustomerPayment(payment);
  },

  async getCustomerLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyHistory[]> {
    return customerRepository.getCustomerLoyaltyHistory(customerId);
  },

  async addCustomerLoyaltyHistory(history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>): Promise<CustomerLoyaltyHistory> {
    return customerRepository.addCustomerLoyaltyHistory(history);
  },

  async updateCustomerBalance(id: number, amount: number): Promise<void> {
    return customerRepository.updateCustomerBalance(id, amount);
  },

  async updateCustomerLoyaltyPoints(id: number, pointsChange: number): Promise<void> {
    return customerRepository.updateCustomerLoyaltyPoints(id, pointsChange);
  }
};

export default customerService;

