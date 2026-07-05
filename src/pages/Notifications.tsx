import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Check, Trash2, CheckSquare, Square, Filter, RefreshCw,
  Info, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  Package, ShoppingCart, Users, Truck, CreditCard, Settings, Terminal
} from 'lucide-react';
import { useNotificationsStore, Notification } from '../stores/notificationsStore';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { 
    initializeNotifications, 
    getNotifications, 
    markAsRead, 
    markSelectedRead, 
    markAllRead, 
    deleteNotification, 
    deleteSelected, 
    clearAll 
  } = useNotificationsStore();

  // Load from store
  useEffect(() => {
    initializeNotifications();
  }, []);

  const allNotifications = getNotifications();

  // Filters State
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all'); // 'all', 'read', 'unread'
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Apply filters
  const filteredNotifications = allNotifications.filter(notif => {
    if (filterModule !== 'all' && notif.module !== filterModule) return false;
    if (filterType !== 'all' && notif.type !== filterType) return false;
    if (filterRead === 'read' && !notif.read) return false;
    if (filterRead === 'unread' && notif.read) return false;
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchTitle = notif.title.toLowerCase().includes(query);
      const matchMessage = notif.message.toLowerCase().includes(query);
      return matchTitle || matchMessage;
    }
    
    return true;
  });

  // Selection handlers
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  // Grouping notifications by date: Today, Yesterday, Earlier
  const getGroupedNotifications = () => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    filteredNotifications.forEach(notif => {
      const notifDate = new Date(notif.createdAt);
      const notifDateStr = notifDate.toDateString();

      if (notifDateStr === todayStr) {
        today.push(notif);
      } else if (notifDateStr === yesterdayStr) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = getGroupedNotifications();

  // Helper to render type icons
  const renderIcon = (type: Notification['type'], module: Notification['module']) => {
    const baseClass = "h-5 w-5 shrink-0";
    
    // Choose icon depending on module
    let ModuleIcon = Bell;
    if (module === 'inventory') ModuleIcon = Package;
    else if (module === 'sales') ModuleIcon = ShoppingCart;
    else if (module === 'customers') ModuleIcon = Users;
    else if (module === 'suppliers') ModuleIcon = Truck;
    else if (module === 'expenses') ModuleIcon = CreditCard;
    else if (module === 'system') ModuleIcon = Settings;

    switch (type) {
      case 'success':
        return (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <ModuleIcon className={baseClass} />
          </div>
        );
      case 'warning':
        return (
          <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/50 text-amber-600 dark:text-amber-400">
            <ModuleIcon className={baseClass} />
          </div>
        );
      case 'error':
        return (
          <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/50 text-rose-600 dark:text-rose-400">
            <ModuleIcon className={baseClass} />
          </div>
        );
      default:
        return (
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200/50 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
            <ModuleIcon className={baseClass} />
          </div>
        );
    }
  };

  // Action dispatcher
  const handleAction = (notif: Notification) => {
    markAsRead(notif.id);
    if (!notif.actionType) return;
    
    switch (notif.actionType) {
      case 'view_product':
        navigate('/inventory');
        break;
      case 'view_customer':
        navigate('/customers');
        break;
      case 'view_supplier':
        navigate('/suppliers');
        break;
      case 'view_sale':
        navigate('/sales-history');
        break;
      case 'view_purchase':
        navigate('/purchases');
        break;
      case 'view_expense':
        navigate('/expenses');
        break;
      case 'view_settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  const getActionLabel = (actionType?: string) => {
    if (!actionType) return '';
    switch (actionType) {
      case 'view_product': return 'View Product';
      case 'view_customer': return 'View Customer';
      case 'view_supplier': return 'View Supplier';
      case 'view_sale': return 'Open Sale';
      case 'view_purchase': return 'Open Purchase Order';
      case 'view_expense': return 'View Expense';
      case 'view_settings': return 'Configure Settings';
      default: return 'Resolve Action';
    }
  };

  // Bulk Executions
  const handleMarkSelectedRead = () => {
    markSelectedRead(selectedIds);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    deleteSelected(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Notification Center"
        subtitle="Manage alerts and logs from sales, inventory thresholds, supplier balances, and backend transactions."
        icon={Bell}
        breadcrumbs={[
          { label: 'Home', onClick: () => window.location.hash = '#/' },
          { label: 'Notifications' }
        ]}
        actions={[
          {
            label: 'Mark All Read',
            onClick: markAllRead,
            icon: Check,
            variant: 'secondary',
            disabled: filteredNotifications.length === 0
          },
          {
            label: 'Clear All',
            onClick: clearAll,
            icon: Trash2,
            variant: 'secondary',
            disabled: allNotifications.length === 0
          }
        ]}
      />

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sticky Filters Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-5 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-slate-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-blue-500" /> Filters
            </h3>
            {(filterModule !== 'all' || filterType !== 'all' || filterRead !== 'all' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setFilterModule('all');
                  setFilterType('all');
                  setFilterRead('all');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Search Query */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Search Logs</label>
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-gray-800 rounded-xl bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Read / Unread Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-gray-800 rounded-xl bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Alerts</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>

            {/* Module Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Module Source</label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-gray-800 rounded-xl bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Modules</option>
                <option value="inventory">Inventory Catalog</option>
                <option value="sales">Sales & Returns</option>
                <option value="customers">Customers Store</option>
                <option value="suppliers">Suppliers Store</option>
                <option value="expenses">Expenses</option>
                <option value="system">System Logs</option>
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Severity Level</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-gray-800 rounded-xl bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Severities</option>
                <option value="info">Information (Info)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="error">Error (Red)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feed Timeline Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Bulk Selection Header */}
          {filteredNotifications.length > 0 && (
            <div className="bg-slate-100/60 dark:bg-gray-900/60 border border-slate-200/50 dark:border-gray-800/80 rounded-2xl p-3 px-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={toggleSelectAll} 
                  className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {selectedIds.length === filteredNotifications.length ? (
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'Select All'}
                </span>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMarkSelectedRead}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                  >
                    <Check className="h-3.5 w-3.5" /> <span>Mark Read</span>
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline Feed */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200/80 dark:border-gray-800 p-12 text-center flex flex-col items-center justify-center">
              <div className="bg-slate-100 dark:bg-gray-950 p-4.5 rounded-full border border-slate-200/40 dark:border-gray-800 text-slate-400 dark:text-gray-500 mb-4.5">
                <Bell className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
              <p className="text-slate-400 dark:text-gray-500 text-sm max-w-sm mt-1">
                There are no active notifications matching your filters. New alerts will display here as they trigger.
              </p>
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200 dark:before:bg-gray-800">
              
              {/* Group: Today */}
              {today.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 ml-2.5">
                    <span className="h-2.5 w-2.5 bg-blue-500 rounded-full ring-4 ring-blue-50 dark:ring-blue-950/40" />
                    <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Today</h4>
                  </div>
                  <div className="space-y-3">
                    {today.map(notif => renderNotificationCard(notif))}
                  </div>
                </div>
              )}

              {/* Group: Yesterday */}
              {yesterday.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 ml-2.5">
                    <span className="h-2.5 w-2.5 bg-slate-400 dark:bg-gray-500 rounded-full ring-4 ring-slate-50 dark:ring-gray-800" />
                    <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Yesterday</h4>
                  </div>
                  <div className="space-y-3">
                    {yesterday.map(notif => renderNotificationCard(notif))}
                  </div>
                </div>
              )}

              {/* Group: Earlier */}
              {earlier.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 ml-2.5">
                    <span className="h-2.5 w-2.5 bg-slate-300 dark:bg-gray-600 rounded-full ring-4 ring-slate-50 dark:ring-gray-900" />
                    <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Earlier</h4>
                  </div>
                  <div className="space-y-3">
                    {earlier.map(notif => renderNotificationCard(notif))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render individual notification card
  function renderNotificationCard(notif: Notification) {
    const isSelected = selectedIds.includes(notif.id);
    const dateFormatted = new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
      ' - ' + new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
      <div 
        key={notif.id}
        className={`relative flex gap-4 p-4.5 bg-white dark:bg-gray-900 border rounded-2xl transition-all duration-200 group hover:shadow-md hover:border-slate-300 dark:hover:border-gray-700 ${
          notif.read 
            ? 'border-slate-200/80 dark:border-gray-800/80 opacity-75' 
            : 'border-blue-200/80 dark:border-blue-900/30 bg-blue-50/5 dark:bg-blue-950/5 font-medium'
        } ${isSelected ? 'ring-2 ring-blue-500/30 border-blue-500 dark:border-blue-500' : ''}`}
      >
        {/* Selection Checkbox */}
        <div className="flex items-center shrink-0">
          <button 
            onClick={() => toggleSelect(notif.id)} 
            className="text-slate-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition"
          >
            {isSelected ? (
              <CheckSquare className="h-4.5 w-4.5 text-blue-500" />
            ) : (
              <Square className="h-4.5 w-4.5 opacity-60 group-hover:opacity-100" />
            )}
          </button>
        </div>

        {/* Color Coded Icon */}
        {renderIcon(notif.type, notif.module)}

        {/* Content body */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h5 className="font-bold text-slate-900 dark:text-white text-[15px] leading-snug">
              {notif.title}
            </h5>
            <span className="text-[11px] text-slate-400 dark:text-gray-500 font-semibold uppercase shrink-0 mt-0.5">
              {dateFormatted}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
            {notif.message}
          </p>

          {/* Contextual Action Button */}
          {notif.actionType && (
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => handleAction(notif)}
                className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
              >
                <span>{getActionLabel(notif.actionType)}</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Hover quick mark/delete */}
        <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notif.read && (
            <button
              onClick={() => markAsRead(notif.id)}
              title="Mark as read"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-800 transition"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => deleteNotification(notif.id)}
            title="Delete notification"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/20 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
};

export default Notifications;
