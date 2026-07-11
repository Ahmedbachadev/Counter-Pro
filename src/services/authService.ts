import { authRepository } from '../backend/repositories/AuthRepository';
import { getProvider } from '../backend/providers';
import type { User } from '../backend/types';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
const useLocal = () => isElectron && typeof navigator !== 'undefined' && !navigator.onLine;

export const authService = {
  async authenticateUser(username: string, password: string): Promise<any> {
    // Auth repository is strictly using supabase for authentication right now, so we keep using it directly.
    return authRepository.authenticateUser(username, password);
  },

  async addLoginHistory(record: any): Promise<number> {
    return authRepository.addLoginHistory(record);
  },

  async updateLoginHistory(id: number, record: any): Promise<void> {
    return authRepository.updateLoginHistory(id, record);
  },

  async getUsers(): Promise<User[]> {
    return useLocal() ? authRepository.getUsers() : getProvider().getUsers();
  },

  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return useLocal() ? authRepository.addUser(user) : getProvider().addUser(user);
  },

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    return useLocal() ? authRepository.updateUser(id, updates) : getProvider().updateUser(id, updates);
  },

  async deleteUser(id: number): Promise<void> {
    return useLocal() ? authRepository.deleteUser(id) : getProvider().deleteUser(id);
  }
};

export default authService;

