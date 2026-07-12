import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Store,
  Truck,
  CreditCard,
  Undo2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import permissionService from '../services/permissionService';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { shopSettings } = useSettingsStore();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const allGroups = [
    {
      title: t('common.core', 'Core'),
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: t('common.dashboard'), moduleKey: 'dashboard' },
        { to: '/dashboard/pos', icon: ShoppingCart, label: t('common.pos'), moduleKey: 'pos' },
      ]
    },
    {
      title: t('common.management', 'Management'),
      items: [
        { to: '/dashboard/inventory', icon: Package, label: t('common.inventory'), moduleKey: 'inventory' },
        { to: '/dashboard/purchases', icon: ShoppingBag, label: t('common.purchases', 'Purchases'), moduleKey: 'purchases' },
        { to: '/dashboard/expenses', icon: CreditCard, label: t('common.expenses', 'Expenses'), moduleKey: 'expenses' },
      ]
    },
    {
      title: t('common.relations', 'Relations'),
      items: [
        { to: '/dashboard/customers', icon: Users, label: t('common.customers'), moduleKey: 'customers' },
        { to: '/dashboard/suppliers', icon: Truck, label: t('common.suppliers'), moduleKey: 'suppliers' },
      ]
    },
    {
      title: t('common.operations', 'Operations'),
      items: [
        { to: '/dashboard/sales-history', icon: Receipt, label: t('common.salesHistory'), moduleKey: 'sales' },
        { to: '/dashboard/returns', icon: Undo2, label: t('common.returns', 'Returns & Exchanges'), moduleKey: 'returns' },
      ]
    },
    {
      title: t('common.system', 'System'),
      items: [
        { to: '/dashboard/reports', icon: BarChart3, label: t('common.reports'), moduleKey: 'reports' },
        { to: '/dashboard/settings', icon: Settings, label: t('common.settings'), moduleKey: 'settings' },
        { to: '/dashboard/backup', icon: Database, label: t('common.backup', 'Backup & Restore'), moduleKey: 'settings' },
      ]
    }
  ];

  // Filter items and groups based on module permissions
  const groups = allGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        permissionService.hasModuleAccess(user, item.moduleKey as any)
      )
    }))
    .filter(group => group.items.length > 0);

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col z-50 shrink-0 transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 lg:static lg:translate-x-0
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0">
              <img src="/assets/primarylogo.png" alt="Logo" className="h-12 object-contain" />
            </div>
          </div>
          
          {/* Collapse Button - Desktop Only */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-gray-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6 scrollbar-thin">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {/* Group Title */}
              {!sidebarCollapsed && (
                <h3 className="px-3.5 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-opacity duration-200">
                  {group.title}
                </h3>
              )}
              {sidebarCollapsed && (
                <div className="h-px bg-slate-100 dark:bg-gray-800 my-4 mx-2" />
              )}
              
              <ul className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <li key={itemIdx}>
                      <NavLink
                        to={item.to}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative group
                            ${sidebarCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'}
                            ${
                              isActive
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-850 hover:text-slate-900 dark:hover:text-white'
                            }
                          `
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !sidebarCollapsed && (
                              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600" />
                            )}
                            <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-250 group-hover:scale-105 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-650'}`} />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                            
                            {/* Hover Tooltip when Collapsed */}
                            {sidebarCollapsed && (
                              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                {item.label}
                              </div>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;