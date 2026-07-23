import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy-load landing page for code splitting
const LandingPage = React.lazy(() => import('./landing/LandingPage'));
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
import AuthGuard from './components/AuthGuard';
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const POS = React.lazy(() => import('./pages/POS'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Purchases = React.lazy(() => import('./pages/Purchases'));
const SalesHistory = React.lazy(() => import('./pages/SalesHistory'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ReceiptSettings = React.lazy(() => import('./pages/ReceiptSettings'));
const ReturnsExchanges = React.lazy(() => import('./pages/ReturnsExchanges'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const AccountCenter = React.lazy(() => import('./pages/AccountCenter'));
const WorkspaceExpired = React.lazy(() => import('./pages/WorkspaceExpired'));
const AdminRoutes = React.lazy(() => import('./adminpanel/routes/AdminRoutes'));
const AdminLogin = React.lazy(() => import('./adminpanel/pages/AdminLogin'));
const SyncManager = React.lazy(() => import('./pages/SyncManager'));
const BackupManager = React.lazy(() => import('./pages/BackupManager'));
import './i18n/config';
import { useSyncStore } from './stores/syncStore';

// Fixed: Reconstructed the missing LayoutWrapper function definition
const LayoutWrapper = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="pos" element={<POS />} />
        <Route path="customers" element={<Customers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="sales-history" element={<SalesHistory />} />
        <Route path="returns" element={<ReturnsExchanges />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/receipt" element={<ReceiptSettings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="account-center" element={<AccountCenter />} />
        <Route path="sync" element={<SyncManager />} />
        <Route path="backup" element={<BackupManager />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const Router = (window as any).electronAPI ? HashRouter : BrowserRouter;
  const isElectron = !!(window as any).electronAPI;
  const [isDbReady, setIsDbReady] = React.useState(!isElectron);
  const [isSyncReady, setIsSyncReady] = React.useState(!isElectron);
  const { isDarkMode } = useThemeStore();
  const { i18n } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const { isOnline } = useSyncStore();

  const { initializeFromDatabase: initInventory } = useInventoryStore();
  const { initializeFromDatabase: initCustomers } = useCustomerStore();
  const { initializeFromDatabase: initPOS } = usePOSStore();
  const { initializeFromDatabase: initSettings } = useSettingsStore();
  const { initializeFromDatabase: initSuppliers } = useSupplierStore();
  const { initializeFromDatabase: initExpenses } = useExpensesStore();
  const { initializeFromDatabase: initPurchases } = usePurchaseStore();

  useEffect(() => {
    console.log('React mounted');
    if (isElectron) {
      const checkDb = async () => {
        try {
          // Add a timeout to prevent getting stuck if IPC channel fails to respond
          const ready = await Promise.race([
            (window as any).electronAPI.waitUntilDbReady(),
            new Promise((resolve) => setTimeout(() => resolve(true), 3000))
          ]);
          
          if (ready) {
            console.log('Application ready');
            setIsDbReady(true);
          } else {
            // Retry checking after a short delay (e.g. 100ms) until database completes migrations
            setTimeout(checkDb, 100);
          }
        } catch (error) {
          console.error('Failed to check database ready:', error);
          // Retry instead of silently failing and getting stuck
          setTimeout(checkDb, 500);
        }
      };
      checkDb();
    }
  }, [isElectron]);

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
    // Initialize all stores from local SQLite cache
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

    if (isDbReady && isAuthenticated && isSyncReady) {
      initializeStores();
      useSyncStore.getState().initializeListeners();
    }
  }, [isDbReady, isAuthenticated, isSyncReady, isOnline]);

  // Offline-first: Forward auth session to main process for sync engine
  useEffect(() => {
    const setupSync = async () => {
      if (!isElectron) return;
      if (!isAuthenticated || !user?.workspaceId) {
        setIsSyncReady(false);
        return;
      }

      setIsSyncReady(false); // Reset before establishing new session

      try {
        // Get current Supabase session tokens from the renderer
        const supabaseModule = await import('./backend/supabaseClient');
        const supabase = supabaseModule.default;
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('[Sync] No Supabase session available to forward');
          return;
        }

        // Forward auth tokens to the main process
        console.log('[Sync] Forwarding auth session to main process...');
        await (window as any).electronAPI.setSupabaseSession(
          session.access_token,
          session.refresh_token
        );

        // Initialize sync with workspace ID
        console.log('[Sync] Initializing sync for workspace:', user.workspaceId);
        await (window as any).electronAPI.initializeSync(String(user.workspaceId));

        console.log('[Sync] Sync bridge established successfully');
        setIsSyncReady(true);
      } catch (err) {
        console.error('[Sync] Failed to set up sync bridge:', err);
      }
    };

    setupSync();
  }, [isAuthenticated, user?.workspaceId, isElectron]);

  // Stop sync on logout
  useEffect(() => {
    if (isElectron && !isAuthenticated) {
      (window as any).electronAPI?.stopSync?.()?.catch?.((err: any) => {
        console.error('[Sync] Failed to stop sync on logout:', err);
      });
    }
  }, [isAuthenticated, isElectron]);

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


  if (!isDbReady) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <div className="relative flex items-center justify-center">
          {/* Animated pulsing gradient rings */}
          <div className="absolute h-32 w-32 animate-ping rounded-full bg-indigo-500/10 duration-1000"></div>
          <div className="absolute h-24 w-24 animate-pulse rounded-full bg-indigo-500/20"></div>
          {/* Inner spinner */}
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
        <h1 className="mt-8 text-2xl font-bold tracking-wider text-slate-100 animate-pulse">
          Counter Pro
        </h1>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          Loading secure local database...
        </p>
        <span className="mt-1 text-xs text-indigo-400 font-semibold uppercase tracking-widest">
          Offline Workspace
        </span>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={isElectron ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/expired" element={<WorkspaceExpired />} />

          {/* Admin Platform Routes */}
          <Route path="/adminpanel/login" element={<AdminLogin />} />
          <Route path="/adminpanel/*" element={<AdminRoutes />} />

          {/* Private Protected Routes */}
          <Route
            path="/dashboard/*"
            element={
              <AuthGuard>
                <LayoutWrapper />
              </AuthGuard>
            }
          />

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;