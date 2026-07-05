import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import supabase from '../../backend/supabaseClient';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, appType, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (!isAuthenticated || appType !== 'admin') {
           if (isMounted) {
              setIsAuthorized(false);
              setIsInitializing(false);
           }
           return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (isMounted) {
            setIsAuthorized(false);
            setIsInitializing(false);
          }
          return;
        }

        // Validate platform_admins membership
        const { data, error } = await supabase
          .from('platform_admins')
          .select('is_active, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (isMounted) {
          if (!error && data?.is_active && data.role === 'Super Admin') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            // Only sign out if they were actually logged in as admin
            if (appType === 'admin') {
               let msg = 'Your platform administrator account is no longer active.';
               if (data && data.role !== 'Super Admin') msg = 'You do not have Super Admin privileges.';
               await logout(msg);
            }
          }
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('Admin Auth Guard Error:', err);
        if (isMounted) {
          setIsAuthorized(false);
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, appType, logout]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If completely unauthorized (no session or not an admin)
  if (!isAuthorized) {
    // If they are a business user trying to access admin panel
    if (isAuthenticated && appType === 'business') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Access Denied</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Business users cannot access the Counter Pro Platform Administration.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // No session at all, or failed admin check, just redirect to admin login
    return <Navigate to="/adminpanel/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
