import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useInventoryStore } from './stores/inventoryStore';
import { useCustomerStore } from './stores/customersStore';
import { usePOSStore } from './stores/posStore';
import { useSettingsStore } from './stores/settingsStore';
import { useSupplierStore } from './stores/supplierStore';
import { useExpensesStore } from './stores/expensesStore';
import { usePurchaseStore } from './stores/purchaseStore';
import realtimeManager from './backend/realtime';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Purchases from './pages/Purchases';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ReturnsExchanges from './pages/ReturnsExchanges';
import Notifications from './pages/Notifications';
import AccountCenter from './pages/AccountCenter';
import WorkspaceExpired from './pages/WorkspaceExpired';
import AdminRoutes from './adminpanel/routes/AdminRoutes';
import AdminLogin from './adminpanel/pages/AdminLogin';
import './i18n/config';



      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/sales-history" element={<SalesHistory />} />
        <Route path="/returns" element={<ReturnsExchanges />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/account-center" element={<AccountCenter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const { isDarkMode } = useThemeStore();
  const { i18n } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  const { initializeFromDatabase: initInventory } = useInventoryStore();
  const { initializeFromDatabase: initCustomers } = useCustomerStore();
  const { initializeFromDatabase: initPOS } = usePOSStore();
  const { initializeFromDatabase: initSettings } = useSettingsStore();
  const { initializeFromDatabase: initSuppliers } = useSupplierStore();
  const { initializeFromDatabase: initExpenses } = useExpensesStore();
  const { initializeFromDatabase: initPurchases } = usePurchaseStore();

  useEffect(() => {
    // Apply theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Apply RTL for Urdu
    if (i18n.language === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [i18n.language]);

  useEffect(() => {
    // Initialize all stores
    const initializeStores = async () => {
      try {
        await Promise.all([
          initInventory().catch(err => console.error('Failed to init inventory:', err)),
          initCustomers().catch(err => console.error('Failed to init customers:', err)),
          initPOS().catch(err => console.error('Failed to init POS:', err)),
          initSettings().catch(err => console.error('Failed to init settings:', err)),
          initSuppliers().catch(err => console.error('Failed to init suppliers:', err)),
          initExpenses().catch(err => console.error('Failed to init expenses:', err)),
          initPurchases().catch(err => console.error('Failed to init purchases:', err)),
        ]);
        console.log('All stores initialized successfully');
      } catch (error) {
        console.error('Store initialization error:', error);
      }
    };

    // Add a small delay to ensure database is ready
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        initializeStores();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.workspaceId) {
      realtimeManager.initialize(user.workspaceId);
    } else {
      realtimeManager.disconnect();
    }
    
    return () => {
      realtimeManager.disconnect();
    };
  }, [isAuthenticated, user?.workspaceId]);

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/expired" element={<WorkspaceExpired />} />

        {/* Admin Platform Routes */}
        <Route path="/adminpanel/login" element={<AdminLogin />} />
        <Route path="/adminpanel/*" element={<AdminRoutes />} />

        {/* Private Protected Routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <LayoutWrapper />
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
