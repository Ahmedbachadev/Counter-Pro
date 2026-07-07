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
    if (isAuthenticated && appType === 'business') {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/adminpanel/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
