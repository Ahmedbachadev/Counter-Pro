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
    if (!supabase) throw new Error('Supabase client is not configured.');
    
    // Call Supabase RPC
    const { data: newUserId, error } = await supabase.rpc('create_staff_user', {
      staff_username: user.username,
      staff_password: user.password,
      staff_role: user.role,
      staff_name: user.name || '',
      staff_phone: user.phone || '',
      staff_permissions: user.permissions || '',
      staff_status: user.status || 'Active',
      workspace_id: user.workspaceId || 1,
      workspace_name: user.workspaceName || '',
      staff_email: user.email || null
    });

    if (error) {
      throw new Error(error.message || 'Failed to create user via RPC');
    }

    return this.create({ ...user, id: newUserId } as any);
  }

  async updateUser(id: number | string, updates: Partial<User>): Promise<void> {
    if (!supabase) throw new Error('Supabase client is not configured.');
    
    const { error } = await supabase.rpc('update_staff_user', {
      staff_id: id,
      new_password: updates.password || null,
      new_metadata: {
        username: updates.username,
        name: updates.name,
        phone: updates.phone,
        role: updates.role,
        permissions: updates.permissions,
        status: updates.status,
        workspaceId: updates.workspaceId,
        workspaceName: updates.workspaceName
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to update user via RPC');
    }

    await this.update(id, updates);
  }

  async deleteUser(id: number | string): Promise<void> {
    if (!supabase) throw new Error('Supabase client is not configured.');
    
    const { error } = await supabase.rpc('delete_staff_user', {
      staff_id: id
    });

    if (error) {
      throw new Error(error.message || 'Failed to delete user via RPC');
    }

    await this.delete(id);
  }
}

export const authRepository = new UserRepositoryProxy();
export default authRepository;
