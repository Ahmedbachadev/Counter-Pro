import { getProvider } from '../providers';
import type { Expense } from '../types';

export const expenseRepository = {
  async getExpenses(): Promise<Expense[]> {
    return getProvider().getExpenses();
  },

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return getProvider().addExpense(expense);
  },

  async updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
    return getProvider().updateExpense(id, updates);
  },

  async deleteExpense(id: number): Promise<void> {
    return getProvider().deleteExpense(id);
  }
};

export default expenseRepository;
