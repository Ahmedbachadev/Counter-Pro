import { expenseRepository } from '../backend/repositories/ExpenseRepository';
import { getProvider } from '../backend/providers';
import type { Expense } from '../backend/types';

// Offline-first: Electron always reads/writes SQLite. Sync engine handles Supabase.
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    return isElectron ? expenseRepository.getExpenses() : getProvider().getExpenses();
  },

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return isElectron ? expenseRepository.addExpense(expense) : getProvider().addExpense(expense);
  },

  async updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
    return isElectron ? expenseRepository.updateExpense(id, updates) : getProvider().updateExpense(id, updates);
  },

  async deleteExpense(id: number): Promise<void> {
    return isElectron ? expenseRepository.deleteExpense(id) : getProvider().deleteExpense(id);
  }
};

export default expenseService;
