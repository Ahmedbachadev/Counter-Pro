import { FrontendBaseRepository, toCamelCase, toSnakeCase } from './FrontendBaseRepository';
import type { Customer, CustomerPayment, CustomerLoyaltyHistory } from '../types';

class CustomerRepositoryProxy extends FrontendBaseRepository<Customer> {
  constructor() {
    super('customers');
  }

  public async getCustomers(): Promise<Customer[]> {
    return this.findAll();
  }

  public async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return this.create(customer);
  }

  public async updateCustomer(id: number | string, updates: Partial<Customer>): Promise<void> {
    await this.update(id, updates);
  }

  public async deleteCustomer(id: number | string): Promise<void> {
    await this.delete(id);
  }

  public async getCustomerPayments(customerId: number | string): Promise<CustomerPayment[]> {
    // Requires a payments repository in the backend. 
    // Fallback to empty array for now since they didn't exist in the initial tables.
    // Assuming we would map this to a `customer_payments` table if needed.
    return [];
  }

  public async addCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    throw new Error('Customer Payments not yet migrated to SQLite');
  }

  public async getCustomerLoyaltyHistory(customerId: number | string): Promise<CustomerLoyaltyHistory[]> {
    return [];
  }

  public async addCustomerLoyaltyHistory(history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>): Promise<CustomerLoyaltyHistory> {
    throw new Error('Customer Loyalty not yet migrated to SQLite');
  }

  public async updateCustomerBalance(id: number | string, amount: number): Promise<void> {
    const customer = await this.findById(id);
    if (!customer) throw new Error('Customer not found');
    await this.update(id, { pendingAmount: (customer.pendingAmount || 0) + amount });
  }

  public async updateCustomerLoyaltyPoints(id: number | string, pointsChange: number): Promise<void> {
    const customer = await this.findById(id);
    if (!customer) throw new Error('Customer not found');
    await this.update(id, { loyaltyPoints: (customer.loyaltyPoints || 0) + pointsChange });
  }
}

export const customerRepository = new CustomerRepositoryProxy();
export default customerRepository;
