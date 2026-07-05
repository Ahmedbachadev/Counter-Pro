import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import permissionService, { ModulePermissions } from '../services/permissionService';
import supabase from '../backend/supabaseClient';

export interface User {
  id: string | number;
  username: string;
  role: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  lastActive?: string;
  workspaceId?: string | number;
  workspaceName?: string;
  permissions?: string | Record<string, boolean>;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  appType: 'business' | 'admin' | null;
  sessionExpiresAt: string | null;
  rememberMe: boolean;
  loginError: string | null;
  currentLoginHistoryId: number | null;
  
  workspaceId: string | number | null;
  workspaceName: string | null;
  userRole: 'Admin' | 'Cashier' | 'Platform Super Admin' | null;
  modulePermissions: ModulePermissions | null;

  loginBusiness: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  loginAdmin: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: (errorMsg?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  checkSession: () => Promise<void>;
  clearLoginError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      appType: null,
      sessionExpiresAt: null,
      rememberMe: false,
      loginError: null,
      currentLoginHistoryId: null,
      workspaceId: null,
      workspaceName: null,
      userRole: null,
      modulePermissions: null,

      loginBusiness: async (usernameOrEmail: string, password: string, rememberMe = false) => {
        set({ loginError: null });
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: usernameOrEmail,
            password
          });
          
          if (authError || !authData.user) {
            throw new Error(authError?.message || 'Invalid email or password.');
          }

          // Verify Business Logic
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              *,
              workspaces!users_workspace_id_fkey!inner(id, name, status, is_lifetime, expiry_date)
            `)
            .eq('id', authData.user.id)
            .maybeSingle();

          if (userError || !userData) {
            await supabase.auth.signOut();
            throw new Error('Your account was not found in any workspace.');
          }

          if (userData.status === 'Disabled') {
            await supabase.auth.signOut();
            throw new Error('User disabled. Please contact your administrator.');
          }

          const workspace = userData.workspaces;
          
          if (!workspace) {
            await supabase.auth.signOut();
            throw new Error('Workspace not found.');
          }

          if (workspace.status === 'Suspended') {
            await supabase.auth.signOut();
            throw new Error('Workspace suspended. Please contact platform support.');
          }
          
          if (workspace.status === 'Disabled') {
            await supabase.auth.signOut();
            throw new Error('Workspace disabled. Please contact platform support.');
          }

          if (!workspace.is_lifetime && workspace.expiry_date) {
            const expiry = new Date(workspace.expiry_date).getTime();
            if (Date.now() > expiry) {
               // Expired, we will still log them in but AuthGuard will catch and redirect to /expired
            }
          }

          const now = new Date();
          const expiryDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
          const expiresAt = new Date(now.getTime() + expiryDuration).toISOString();
          
          const normalizedRole = (userData.role?.toLowerCase() === 'owner' || userData.role?.toLowerCase() === 'admin')
            ? 'Admin'
            : 'Cashier';

          const userPermissions = permissionService.getPermissions(userData);

          await supabase.from('users').update({ last_active: now.toISOString() }).eq('id', userData.id);

          if (!rememberMe) {
            sessionStorage.setItem('session_active', 'true');
          } else {
            sessionStorage.removeItem('session_active');
          }

          set({
            isAuthenticated: true,
            appType: 'business',
            user: { 
              id: userData.id,
              username: userData.username || authData.user.email?.split('@')[0] || '',
              email: userData.email,
              role: normalizedRole,
              name: userData.name,
              status: userData.status,
              lastActive: now.toISOString(), 
              workspaceId: workspace.id, 
              workspaceName: workspace.name 
            },
            sessionExpiresAt: expiresAt,
            rememberMe,
            loginError: null,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            userRole: normalizedRole,
            modulePermissions: userPermissions,
            currentLoginHistoryId: null
          });
          return true;
        } catch (error: any) {
          console.error('Business Authentication error:', error);
          set({ loginError: error.message || 'Unable to log in. Please try again.' });
          return false;
        }
      },

      loginAdmin: async (usernameOrEmail: string, password: string, rememberMe = false) => {
        set({ loginError: null });
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: usernameOrEmail,
            password
          });
          
          if (authError || !authData.user) {
            throw new Error(authError?.message || 'Invalid email or password.');
          }

          // Verify Admin Logic
          const { data: adminData, error: adminError } = await supabase
            .from('platform_admins')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (adminError || !adminData) {
            await supabase.auth.signOut();
            throw new Error('Platform Administrator not found.');
          }

          if (!adminData.is_active) {
            await supabase.auth.signOut();
            throw new Error('Platform Administrator disabled.');
          }
          
          if (adminData.role !== 'Super Admin') {
             await supabase.auth.signOut();
             throw new Error('Unauthorized role.');
          }

          const now = new Date();
          const expiryDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
          const expiresAt = new Date(now.getTime() + expiryDuration).toISOString();
          
          if (!rememberMe) {
            sessionStorage.setItem('session_active', 'true');
          } else {
            sessionStorage.removeItem('session_active');
          }

          set({
            isAuthenticated: true,
            appType: 'admin',
            user: { 
              id: adminData.id,
              username: authData.user.email?.split('@')[0] || '',
              email: authData.user.email,
              role: 'Platform Super Admin',
              name: adminData.name,
            },
            sessionExpiresAt: expiresAt,
            rememberMe,
            loginError: null,
            workspaceId: null,
            workspaceName: null,
            userRole: 'Platform Super Admin',
            modulePermissions: null,
            currentLoginHistoryId: null
          });
          return true;
        } catch (error: any) {
          console.error('Admin Authentication error:', error);
          set({ loginError: error.message || 'Unable to log in. Please try again.' });
          return false;
        }
      },

      logout: async (errorMsg?: string) => {
        sessionStorage.removeItem('session_active');
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({
          isAuthenticated: false,
          user: null,
          appType: null,
          sessionExpiresAt: null,
          rememberMe: false,
          loginError: errorMsg || null,
          workspaceId: null,
          workspaceName: null,
          userRole: null,
          modulePermissions: null,
          currentLoginHistoryId: null
        });
      },

      updateUserProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({
          user: {
            ...currentUser,
            ...updates
          }
        });
      },

      checkSession: async () => {
        const { isAuthenticated, rememberMe, logout } = get();
        if (isAuthenticated) {
          const isSessionActive = sessionStorage.getItem('session_active') === 'true';
          if (!rememberMe && !isSessionActive) {
            await logout();
            return;
          }

          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              await logout();
            }
          }
        }
      },

      clearLoginError: () => {
        set({ loginError: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        appType: state.appType,
        sessionExpiresAt: state.sessionExpiresAt,
        rememberMe: state.rememberMe,
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        userRole: state.userRole,
        modulePermissions: state.modulePermissions,
        currentLoginHistoryId: state.currentLoginHistoryId
      })
    }
  )
);

// Subscribe to Supabase auth events just to clear out state when logged out from another tab
if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      const store = useAuthStore.getState();
      if (store.isAuthenticated) {
        useAuthStore.setState({
          isAuthenticated: false,
          user: null,
          appType: null,
          sessionExpiresAt: null,
          workspaceId: null,
          workspaceName: null,
          userRole: null,
          modulePermissions: null,
          currentLoginHistoryId: null
        });
      }
    }
  });
}