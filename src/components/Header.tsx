import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Plus,
  Search,
  Bell,
  User,
  Check,
  ExternalLink,
  X,
  Command,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Keyboard,
  ChevronRight,
  Package,
  Users,
  Receipt,
  ShoppingBag,
  Truck,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCustomerStore } from '../stores/customersStore';
import { usePOSStore } from '../stores/posStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import { useSupplierStore } from '../stores/supplierStore';
import { useExpensesStore } from '../stores/expensesStore';
import SyncIndicator from './sync/SyncIndicator';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { shopSettings } = useSettingsStore();
  const { toggleMobileSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  
  const { initializeNotifications, getNotifications, markAsRead, markAllRead } = useNotificationsStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stores for global search indexing
  const products = useInventoryStore(state => state.products);
  const customers = useCustomerStore(state => state.customers);
  const sales = usePOSStore(state => state.sales);
  const purchases = usePurchaseStore(state => state.purchases);
  const suppliers = useSupplierStore(state => state.suppliers);
  const expenses = useExpensesStore(state => state.expenses);

  useEffect(() => {
    initializeNotifications();
    
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setQuickAddOpen(false);
      }
    };
    
    // Keyboard shortcuts listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setShortcutsModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const notifications = getNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    setDropdownOpen(false);
    
    if (!notif.actionType) return;
    switch (notif.actionType) {
      case 'view_product': navigate('/dashboard/inventory'); break;
      case 'view_customer': navigate('/dashboard/customers'); break;
      case 'view_supplier': navigate('/dashboard/suppliers'); break;
      case 'view_sale': navigate('/dashboard/sales-history'); break;
      case 'view_purchase': navigate('/dashboard/purchases'); break;
      case 'view_expense': navigate('/dashboard/expenses'); break;
      case 'view_settings': navigate('/dashboard/settings'); break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Breadcrumbs generation
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const list = [{ label: 'Dashboard', to: '/dashboard' }];
    
    paths.forEach((path, idx) => {
      const to = `/${paths.slice(0, idx + 1).join('/')}`;
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      
      // Normalize labels
      if (path === 'pos') label = 'POS';
      if (path === 'sales-history') label = 'Sales History';
      if (path === 'account-center') label = 'Account Center';
      
      list.push({ label, to });
    });
    
    return list;
  }, [location.pathname]);

  // Global Search Engine
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results: Array<{
      type: 'Product' | 'Customer' | 'Sale' | 'Purchase' | 'Supplier' | 'Expense' | 'Report';
      title: string;
      subtitle: string;
      icon: any;
      action: () => void;
    }> = [];

    // Products Search
    products.forEach(p => {
      if (p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query))) {
        results.push({
          type: 'Product',
          title: p.name,
          subtitle: `SKU: ${p.sku || 'N/A'} • Price: Rs. ${p.price}`,
          icon: Package,
          action: () => { navigate('/dashboard/inventory'); setSearchModalOpen(false); }
        });
      }
    });

    // Customers Search
    customers.forEach(c => {
      if (c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))) {
        results.push({
          type: 'Customer',
          title: c.name,
          subtitle: `Phone: ${c.phone || 'N/A'} • Balance: Rs. ${c.pendingAmount}`,
          icon: Users,
          action: () => { navigate(`/dashboard/customers?id=${c.id}`); setSearchModalOpen(false); }
        });
      }
    });

    // Suppliers Search
    suppliers.forEach(s => {
      if (s.name.toLowerCase().includes(query) || (s.phone && s.phone.includes(query))) {
        results.push({
          type: 'Supplier',
          title: s.name,
          subtitle: `Phone: ${s.phone || 'N/A'} • Company: ${s.companyName || 'N/A'}`,
          icon: Truck,
          action: () => { navigate('/dashboard/suppliers'); setSearchModalOpen(false); }
        });
      }
    });

    // Sales Search
    sales.forEach(sale => {
      const saleIdStr = String(sale.id);
      if (saleIdStr.includes(query) || (sale.customerName && sale.customerName.toLowerCase().includes(query))) {
        results.push({
          type: 'Sale',
          title: `Invoice #${sale.id}`,
          subtitle: `Customer: ${sale.customerName || 'Walk-in'} • Amount: Rs. ${sale.finalAmount}`,
          icon: Receipt,
          action: () => { navigate('/dashboard/sales-history'); setSearchModalOpen(false); }
        });
      }
    });

    // Purchases Search
    purchases.forEach(p => {
      const pIdStr = String(p.id);
      if (pIdStr.includes(query) || (p.supplierName && p.supplierName.toLowerCase().includes(query))) {
        results.push({
          type: 'Purchase',
          title: `Purchase Bill #${p.id}`,
          subtitle: `Supplier: ${p.supplierName || 'N/A'} • Total: Rs. ${p.finalAmount}`,
          icon: ShoppingBag,
          action: () => { navigate('/dashboard/purchases'); setSearchModalOpen(false); }
        });
      }
    });

    // Expenses Search
    expenses.forEach(e => {
      if (e.description.toLowerCase().includes(query) || e.category.toLowerCase().includes(query)) {
        results.push({
          type: 'Expense',
          title: e.description,
          subtitle: `Category: ${e.category} • Amount: Rs. ${e.amount}`,
          icon: CreditCard,
          action: () => { navigate('/dashboard/expenses'); setSearchModalOpen(false); }
        });
      }
    });

    // Reports Options
    const reportOptions = [
      { title: 'Sales Report', subtitle: 'Detailed sales summaries and charts', action: () => navigate('/dashboard/reports') },
      { title: 'Inventory Report', subtitle: 'Valuation and low stock listings', action: () => navigate('/dashboard/reports') },
      { title: 'Expense Analysis', subtitle: 'Breakdown of expense categories', action: () => navigate('/dashboard/reports') },
    ];
    reportOptions.forEach(rep => {
      if (rep.title.toLowerCase().includes(query)) {
        results.push({
          type: 'Report',
          title: rep.title,
          subtitle: rep.subtitle,
          icon: BarChart3,
          action: () => { rep.action(); setSearchModalOpen(false); }
        });
      }
    });

    return results.slice(0, 8); // return top 8
  }, [searchQuery, products, customers, suppliers, sales, purchases, expenses]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 relative">
          
          {/* Left Side: Brand, Mobile Menu, and Breadcrumbs */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-850 transition-colors"
              aria-label="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>


          </div>

          {/* Center: Shop Logo (Custom) */}
          {shopSettings.logo && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center pointer-events-none">
              <img src={shopSettings.logo} alt="Shop Logo" className="h-10 md:h-12 object-contain" />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3.5 ml-4">
            {/* Command Trigger (Search) */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 border border-slate-200 dark:border-gray-800 rounded-xl bg-slate-50/50 dark:bg-gray-950/50 hover:bg-slate-50 dark:hover:bg-gray-950 text-slate-400 dark:text-gray-500 hover:text-slate-650 dark:hover:text-gray-300 transition-all w-48 lg:w-60"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs text-left flex-1 font-medium">{t('common.search', 'Search...')}</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded text-[9px] font-bold text-slate-450 dark:text-gray-400">
                <Command className="h-2 w-2" />K
              </kbd>
            </button>
            <button
              onClick={() => setSearchModalOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-850"
              aria-label="Global Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Quick Add Dropdown */}
            <div className="relative" ref={quickAddRef}>
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5"
                title="Quick Add Menu"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>

              {quickAddOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-gray-900 transition-all">
                  <div className="py-1">
                    <button onClick={() => { navigate('/dashboard/pos'); setQuickAddOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">New Sale</button>
                    <button onClick={() => { navigate('/dashboard/inventory'); setQuickAddOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">Add Product</button>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/dashboard/customers'); setQuickAddOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">Add Customer</button>
                    <button onClick={() => { navigate('/dashboard/suppliers'); setQuickAddOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">Add Supplier</button>
                    <button onClick={() => { navigate('/dashboard/expenses'); setQuickAddOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">Add Expense</button>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Indicator */}
            <SyncIndicator />

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-850 transition-colors relative focus:outline-none ${dropdownOpen ? 'bg-slate-50 dark:bg-gray-850' : ''}`}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-650 text-white font-bold text-[9px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-gray-900 transition-all">
                  <div className="p-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-gray-900/50">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllRead()} className="text-[10px] text-blue-650 dark:text-blue-400 hover:underline font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-gray-900">
                    {recentNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-300" />
                        <p className="text-xs font-semibold">No notifications</p>
                        <p className="text-[10px] mt-0.5 text-slate-400">All caught up!</p>
                      </div>
                    ) : (
                      recentNotifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 flex gap-3 hover:bg-slate-50/80 dark:hover:bg-gray-900/40 cursor-pointer transition relative group ${!notif.read ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''}`}
                        >
                          {!notif.read && <span className="absolute left-2 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                          <div className="flex-1 min-w-0 pl-1.5">
                            <p className="text-xs text-slate-900 dark:text-white font-semibold truncate leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 leading-snug">{notif.message}</p>
                            <span className="text-[8px] text-slate-400 dark:text-gray-500 block mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 text-center bg-slate-50/50 dark:bg-gray-900/50">
                    <Link to="/dashboard/notifications" onClick={() => setDropdownOpen(false)} className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center">
                      <span>Open Notification Center</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-gray-850 p-1 rounded-xl transition duration-150 group"
              >
                <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-800 flex items-center justify-center overflow-hidden transition duration-150 group-hover:scale-105">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4.5 w-4.5 text-slate-500 dark:text-gray-400" />
                  )}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-gray-900 transition-all">
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || user?.username}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 capitalize truncate mt-0.5">{user?.role} Account</p>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold truncate mt-1">Workspace: {user?.workspaceName || 'Swat Retail'}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard/account-center" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">
                      <User className="h-4 w-4 mr-2.5 text-slate-400" />
                      Account Center
                    </Link>
                    <Link to="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">
                      <SettingsIcon className="h-4 w-4 mr-2.5 text-slate-400" />
                      Settings
                    </Link>
                    <Link to="/dashboard/notifications" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium">
                      <Bell className="h-4 w-4 mr-2.5 text-slate-400" />
                      Notifications
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setShortcutsModalOpen(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium text-left"
                    >
                      <Keyboard className="h-4 w-4 mr-2.5 text-slate-400" />
                      Keyboard Shortcuts
                    </button>
                    <button
                      onClick={() => { alert("Help Documentation is under construction. Please refer to standard CPDS components guide."); setUserMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 font-medium text-left"
                    >
                      <HelpCircle className="h-4 w-4 mr-2.5 text-slate-400" />
                      Help & Center
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2.5 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Global Command Palette Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSearchModalOpen(false)} />
          
          <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-850 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10 animate-slide-in">
            <div className="flex items-center px-4 border-b border-slate-200 dark:border-gray-850">
              <Search className="h-5 w-5 text-slate-400 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, customers, suppliers, sales history, etc..."
                className="w-full py-4 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                autoFocus
              />
              <button onClick={() => setSearchModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-850 text-slate-400 hover:text-slate-650">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto p-2">
              {searchQuery.trim() === '' ? (
                <div className="p-6 text-center text-slate-400">
                  <Command className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">Global Command Palette</p>
                  <p className="text-[10px] mt-0.5">Type to query records across the system.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs font-semibold">No results found for "{searchQuery}"</p>
                  <p className="text-[10px] mt-0.5">Check spelling or try a different filter.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Search Results</p>
                  {searchResults.map((res, index) => {
                    const Icon = res.icon;
                    return (
                      <button
                        key={index}
                        onClick={res.action}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-850 text-left transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200/40 dark:border-gray-800 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mr-3 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-900 dark:text-white font-semibold truncate">{res.title}</p>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-900 text-slate-500 border border-slate-200/40 dark:border-gray-800 uppercase tracking-wider">{res.type}</span>
                          </div>
                          <p className="text-[10px] text-slate-405 dark:text-gray-500 truncate mt-0.5">{res.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-gray-900/50 border-t border-slate-100 dark:border-gray-900 flex items-center justify-between text-[10px] text-slate-400">
              <span>Press <kbd className="border rounded px-1 font-bold">ESC</kbd> to close</span>
              <span>Use keyboard shortcuts for rapid navigation</span>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShortcutsModalOpen(false)} />
          <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-slide-in p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-gray-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-blue-600" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShortcutsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-850 text-slate-400 hover:text-slate-655">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="py-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Open Command Palette</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-gray-900 border rounded font-semibold text-slate-700 dark:text-slate-300">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Close Modal / Escape</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-gray-900 border rounded font-semibold text-slate-700 dark:text-slate-300">ESC</kbd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Open POS Page</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-gray-900 border rounded font-semibold text-slate-700 dark:text-slate-300">Alt + P</kbd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Add Customer Modal</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-gray-900 border rounded font-semibold text-slate-700 dark:text-slate-300">Alt + C</kbd>
              </div>
            </div>
            
            <button onClick={() => setShortcutsModalOpen(false)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-all">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;