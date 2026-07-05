import { User } from '../stores/authStore';

export interface ModulePermissions {
  dashboard: boolean;
  pos: boolean;
  inventory: boolean;
  customers: boolean;
  sales: boolean;
  returns: boolean;
  purchases: boolean;
  suppliers: boolean;
  expenses: boolean;
  reports: boolean;
  notifications: boolean;
  settings: boolean;
}

export const DEFAULT_CASHIER_PERMISSIONS: ModulePermissions = {
  dashboard: true,
  pos: true,
  inventory: false,
  customers: true,
  sales: true,
  returns: true,
  purchases: false,
  suppliers: false,
  expenses: false,
  reports: false,
  notifications: true,
  settings: false
};

export const ADMIN_PERMISSIONS: ModulePermissions = {
  dashboard: true,
  pos: true,
  inventory: true,
  customers: true,
  sales: true,
  returns: true,
  purchases: true,
  suppliers: true,
  expenses: true,
  reports: true,
  notifications: true,
  settings: true
};

export const permissionService = {
  // Parse permissions from user object
  getPermissions(user: User | null): ModulePermissions {
    if (!user) {
      return {
        dashboard: false,
        pos: false,
        inventory: false,
        customers: false,
        sales: false,
        returns: false,
        purchases: false,
        suppliers: false,
        expenses: false,
        reports: false,
        notifications: false,
        settings: false
      };
    }

    const role = user.role?.toLowerCase();
    if (role === 'admin' || role === 'owner') {
      return ADMIN_PERMISSIONS;
    }

    if (user.permissions) {
      try {
        const parsed = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
        return { ...DEFAULT_CASHIER_PERMISSIONS, ...parsed };
      } catch (e) {
        console.error('Failed to parse user permissions:', e);
        return DEFAULT_CASHIER_PERMISSIONS;
      }
    }

    return DEFAULT_CASHIER_PERMISSIONS;
  },

  // Check if user has permission for a specific module path/key
  hasModuleAccess(user: User | null, moduleKey: keyof ModulePermissions): boolean {
    const perms = this.getPermissions(user);
    return !!perms[moduleKey];
  },

  // Check if role is Admin
  isAdmin(user: User | null): boolean {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'owner';
  },

  // Helper to map route path to module permission key
  getModuleKeyFromPath(path: string): keyof ModulePermissions | null {
    const cleanPath = path.split('/')[1] || '';
    switch (cleanPath) {
      case '':
        return 'dashboard';
      case 'pos':
        return 'pos';
      case 'inventory':
        return 'inventory';
      case 'customers':
        return 'customers';
      case 'sales-history':
        return 'sales';
      case 'returns':
        return 'returns';
      case 'purchases':
        return 'purchases';
      case 'suppliers':
        return 'suppliers';
      case 'expenses':
        return 'expenses';
      case 'reports':
        return 'reports';
      case 'notifications':
        return 'notifications';
      case 'settings':
        return 'settings';
      default:
        return null;
    }
  }
};

export default permissionService;
