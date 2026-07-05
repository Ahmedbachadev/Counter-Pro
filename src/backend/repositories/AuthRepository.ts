import supabase from '../supabaseClient';
import type { User } from '../types';

export const authRepository = {
  async addLoginHistory(record: any): Promise<number> {
    return 0; // Deprecated
  },

  async updateLoginHistory(id: number | string, record: any): Promise<void> {
    // Deprecated
  },

  async authenticateUser(usernameOrEmail: string, password: string): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    // Attempt to authenticate with email
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
  },

  async getUsers(): Promise<User[]> {
    return [];
  },

  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    throw new Error('Cannot add users from client.');
  },

  async updateUser(id: number | string, updates: Partial<User>): Promise<void> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (user.id === id || user.email?.toLowerCase() === updates.email?.toLowerCase())) {
        const { error } = await supabase.auth.updateUser({
          data: {
            username: updates.username,
            role: updates.role,
            name: updates.name,
            phone: updates.phone,
            status: updates.status,
            workspaceId: updates.workspaceId,
            workspaceName: updates.workspaceName,
            permissions: updates.permissions
          }
        });
        if (error) throw error;
      }
    }
  },

  async deleteUser(id: number | string): Promise<void> {
    throw new Error('Cannot delete users from client.');
  }
};

export default authRepository;
