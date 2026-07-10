import { FrontendBaseRepository } from './FrontendBaseRepository';
import type { Expense } from '../types';

class ExpenseRepositoryProxy extends FrontendBaseRepository<Expense> {
  constructor() {
    super('expenses');
  }

  public async getExpenses(): Promise<Expense[]> {
    return this.findAll();
  }

  public async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return this.create(expense);
  }

  public async updateExpense(id: number | string, updates: Partial<Expense>): Promise<void> {
    await this.update(id, updates);
  }

  public async deleteExpense(id: number | string): Promise<void> {
    await this.delete(id);
  }
}

export const expenseRepository = new ExpenseRepositoryProxy();
export default expenseRepository;
