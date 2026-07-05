import React, { useState, useEffect } from 'react';
import { useAuthStore, User } from '../stores/authStore';
import authService from '../services/authService';
import { 
  Users, Check, Trash2, Settings, Plus, X 
} from 'lucide-react';
import ContentCard from './ContentCard';

export const StaffManagementPanel: React.FC = () => {
  const { user } = useAuthStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<'Admin' | 'Cashier'>('Cashier');
  const [staffStatus, setStaffStatus] = useState<'Active' | 'Disabled'>('Active');
  const [staffPermissions, setStaffPermissions] = useState<Record<string, boolean>>({
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
    settings: false,
  });

  const moduleLabels: Record<string, string> = {
    dashboard: 'Dashboard Summary',
    pos: 'POS Checkout',
    inventory: 'Inventory & Catalog',
    customers: 'Customer Registry',
    sales: 'Sales History',
    returns: 'Returns & Exchanges',
    purchases: 'Purchase Orders',
    suppliers: 'Supplier Registry',
    expenses: 'Expenses Logs',
    reports: 'Financial Reports',
    notifications: 'System Notifications',
    settings: 'ERP Settings'
  };

  const refreshUsers = async () => {
    try {
      const users = await authService.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedStaff) {
        // Update user
        const updates: any = {
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          role: staffRole,
          status: staffStatus,
          permissions: staffRole === 'Admin' ? undefined : JSON.stringify(staffPermissions)
        };
        if (staffPassword) {
          updates.password = staffPassword;
        }
        await authService.updateUser(selectedStaff.id, updates);
        alert('Staff member updated successfully!');
      } else {
        // Create user
        if (!staffUsername || !staffPassword) {
          alert('Username and password are required for new staff.');
          return;
        }
        await authService.addUser({
          username: staffUsername,
          password: staffPassword,
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          role: staffRole,
          status: staffStatus,
          permissions: staffRole === 'Admin' ? undefined : JSON.stringify(staffPermissions),
          workspaceId: user?.workspaceId || 1,
          workspaceName: user?.workspaceName || 'Swat Retail Workspace'
        });
        alert('New staff member added successfully!');
      }
      handleCancelStaffEdit();
      await refreshUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to save staff member details');
    }
  };

  const handleSelectStaff = (staff: User) => {
    setSelectedStaff(staff);
    setStaffUsername(staff.username);
    setStaffPassword('');
    setStaffEmail(staff.email || '');
    setStaffName(staff.name || '');
    setStaffPhone(staff.phone || '');
    setStaffRole(staff.role === 'Owner' || staff.role === 'Admin' ? 'Admin' : 'Cashier');
    setStaffStatus(staff.status === 'Disabled' ? 'Disabled' : 'Active');
    
    let perms = {
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
      settings: false,
    };
    if (staff.permissions) {
      try {
        const parsed = typeof staff.permissions === 'string' 
          ? JSON.parse(staff.permissions) 
          : staff.permissions;
        perms = { ...perms, ...parsed };
      } catch (e) {}
    }
    setStaffPermissions(perms);
  };

  const handleCancelStaffEdit = () => {
    setSelectedStaff(null);
    setStaffUsername('');
    setStaffPassword('');
    setStaffEmail('');
    setStaffName('');
    setStaffPhone('');
    setStaffRole('Cashier');
    setStaffStatus('Active');
    setStaffPermissions({
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
      settings: false,
    });
  };

  const handleDeleteStaff = async (id: number) => {
    if (id === user?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await authService.deleteUser(id);
        alert('Staff member deleted successfully.');
        await refreshUsers();
      } catch (err) {
        console.error('Failed to delete staff:', err);
      }
    }
  };

  const isAdminUser = user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin';

  if (!isAdminUser) {
    return (
      <ContentCard title="Staff Directory">
        <p className="text-sm text-slate-500">Only workspace administrators can manage staff accounts.</p>
      </ContentCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form to Add/Edit Staff (Left Column) */}
      <div className="lg:col-span-5">
        <ContentCard
          title={selectedStaff ? 'Edit Staff Details' : 'Add New Cashier / Admin'}
          subtitle="Define name, email, credentials, account status and module permissions."
        >
          <form onSubmit={handleSaveStaff} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="e.g. cashier1"
                  disabled={!!selectedStaff}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Password {selectedStaff && '(leave blank to keep)'}
                </label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  required={!selectedStaff}
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Mohammad Ali"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="ali@counterpro.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="e.g. +92 300 0000000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Role Type
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                >
                  <option value="Cashier">Cashier (Configurable Perms)</option>
                  <option value="Admin">Admin (Unrestricted Access)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Account Status
                </label>
                <select
                  value={staffStatus}
                  onChange={(e) => setStaffStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                >
                  <option value="Active">Active (Can log in)</option>
                  <option value="Disabled">Disabled (Suspended access)</option>
                </select>
              </div>
            </div>

            {/* Permissions Config checkboxes (only relevant for cashiers) */}
            {staffRole === 'Cashier' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xxs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Configure Module Access
                </label>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-gray-800 p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-900">
                  {Object.keys(moduleLabels).map((moduleKey) => (
                    <label key={moduleKey} className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={!!staffPermissions[moduleKey]}
                        onChange={(e) => setStaffPermissions(prev => ({
                          ...prev,
                          [moduleKey]: e.target.checked
                        }))}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {moduleLabels[moduleKey]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3">
              {selectedStaff && (
                <button
                  type="button"
                  onClick={handleCancelStaffEdit}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-slate-800 dark:text-white transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition"
              >
                <Check className="h-3.5 w-3.5" />
                {selectedStaff ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </ContentCard>
      </div>

      {/* Staff Directory (Right Column) */}
      <div className="lg:col-span-7">
        <ContentCard
          title="Staff Directory"
          subtitle="Overview of all active and suspended staff members inside your workspace."
        >
          <div className="overflow-x-auto border border-slate-100 dark:border-gray-800 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-800">
              <thead className="bg-slate-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xxs font-extrabold uppercase tracking-widest text-slate-400">Staff Info</th>
                  <th className="px-4 py-3 text-left text-xxs font-extrabold uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-4 py-3 text-left text-xxs font-extrabold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xxs font-extrabold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-850 divide-y divide-slate-100 dark:divide-gray-800">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{u.name || u.username}</p>
                      <p className="text-[10px] text-slate-400">{u.email || u.username}</p>
                      {u.createdAt && (
                        <p className="text-[9px] text-slate-400 mt-0.5">Created: {new Date(u.createdAt).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        u.role?.toLowerCase() === 'owner' || u.role?.toLowerCase() === 'admin'
                          ? 'bg-purple-50 text-purple-600 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30'
                          : 'bg-blue-50 text-blue-600 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                      }`}>
                        {u.role?.toLowerCase() === 'owner' || u.role?.toLowerCase() === 'admin' ? 'Admin' : 'Cashier'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.status === 'Disabled'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/25'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectStaff(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:hover:border-indigo-400 transition"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(u.id)}
                          disabled={u.id === user?.id}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:hover:border-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      </div>
    </div>
  );
};
