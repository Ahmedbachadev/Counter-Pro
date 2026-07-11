import { expenseRepository } from '../backend/repositories/ExpenseRepository';
import { getProvider } from '../backend/providers';
import type { Expense } from '../backend/types';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const useLocal = () => isElectron && typeof navigator !== 'undefined' && !navigator.onLine;

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    return useLocal() ? expenseRepository.getExpenses() : getProvider().getExpenses();
  },

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return useLocal() ? expenseRepository.addExpense(expense) : getProvider().addExpense(expense);
  },

  async updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
    return useLocal() ? expenseRepository.updateExpense(id, updates) : getProvider().updateExpense(id, updates);
  },

  async deleteExpense(id: number): Promise<void> {
    return useLocal() ? expenseRepository.deleteExpense(id) : getProvider().deleteExpense(id);
  }
};

export default expenseService;

