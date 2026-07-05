import { create } from 'zustand';
import expenseService from '../services/expenseService';
import type { Expense } from '../backend/types';

interface ExpensesStore {
  expenses: Expense[];
  initializeFromDatabase: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: number, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  getExpensesByCategory: (category: string) => Expense[];
  getTotalExpenses: () => number;
  getExpensesByDateRange: (startDate: Date, endDate: Date) => Expense[];
}

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
  expenses: [],

  initializeFromDatabase: async () => {
    const expenses = await expenseService.getExpenses();
    set({ expenses });
  },

  addExpense: async (expense) => {
    const newExpense = await expenseService.addExpense(expense);
    set((state) => ({
      expenses: [newExpense, ...state.expenses]
    }));
  },

  updateExpense: async (id, updates) => {
    await expenseService.updateExpense(id, updates);
    set((state) => ({
      expenses: state.expenses.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp
      )
    }));
  },

  deleteExpense: async (id) => {
    await expenseService.deleteExpense(id);
    set((state) => ({
      expenses: state.expenses.filter((exp) => exp.id !== id)
    }));
  },

  getExpensesByCategory: (category) => {
    return get().expenses.filter((exp) => exp.category === category);
  },

  getTotalExpenses: () => {
    return get().expenses.reduce((total, exp) => total + exp.amount, 0);
  },

  getExpensesByDateRange: (startDate, endDate) => {
    return get().expenses.filter((exp) => {
      const expDate = new Date(exp.createdAt);
      return expDate >= startDate && expDate <= endDate;
    });
  }
}));
