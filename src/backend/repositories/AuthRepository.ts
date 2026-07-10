import supabase from '../supabaseClient';
import type { User } from '../types';
import { FrontendBaseRepository, toSnakeCase, toCamelCase } from './FrontendBaseRepository';

class UserRepositoryProxy extends FrontendBaseRepository<User> {
  constructor() {
    super('users');
  }

  // Preserve existing authentication logic as requested by prompt "Do NOT modify authentication"
  async authenticateUser(usernameOrEmail: string, password: string): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    let { data, error } = await supabase.auth.signInWithPassword({
      email: usernameOrEmail,
      password
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Failed to retrieve session from Supabase.');
    }

    const meta = data.user.user_metadata || {};
    const mappedUser = {
      id: data.user.id,
      username: meta.username || usernameOrEmail.split('@')[0],
      email: data.user.email,
      role: meta.role || 'Cashier',
      name: meta.name || '',
      phone: meta.phone || '',
      status: meta.status || 'Active',
      workspaceId: meta.workspaceId || 1,
      workspaceName: meta.workspaceName || 'Counter Pro Workspace',
      permissions: meta.permissions || ''
    };

    return mappedUser;
  }

  async addLoginHistory(record: any): Promise<number> {
    return 0; // Deprecated
  }

  async updateLoginHistory(id: number | string, record: any): Promise<void> {
    // Deprecated
  }

  // Expose local database CRUD for user management inside the app
  async getUsers(): Promise<User[]> {
    return this.findAll();
  }

  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return this.create(user);
  }

  async updateUser(id: number | string, updates: Partial<User>): Promise<void> {
    await this.update(id, updates);
  }

  async deleteUser(id: number | string): Promise<void> {
    await this.delete(id);
  }
}

export const authRepository = new UserRepositoryProxy();
export default authRepository;
