import { expenseRepository } from '../backend/repositories/ExpenseRepository';
import type { Expense } from '../backend/types';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    return expenseRepository.getExpenses();
  },

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return expenseRepository.addExpense(expense);
  },

  async updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
    return expenseRepository.updateExpense(id, updates);
  },

  async deleteExpense(id: number): Promise<void> {
    return expenseRepository.deleteExpense(id);
  }
};

export default expenseService;

