import { authRepository } from '../backend/repositories/AuthRepository';
import type { User } from '../backend/types';

export const authService = {
  async authenticateUser(username: string, password: string): Promise<any> {
    return authRepository.authenticateUser(username, password);
  },

  async addLoginHistory(record: any): Promise<number> {
    return authRepository.addLoginHistory(record);
  },

  async updateLoginHistory(id: number, record: any): Promise<void> {
    return authRepository.updateLoginHistory(id, record);
  },

  async getUsers(): Promise<User[]> {
    return authRepository.getUsers();
  },

  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return authRepository.addUser(user);
  },

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    return authRepository.updateUser(id, updates);
  },

  async deleteUser(id: number): Promise<void> {
    return authRepository.deleteUser(id);
  }
};

export default authService;

