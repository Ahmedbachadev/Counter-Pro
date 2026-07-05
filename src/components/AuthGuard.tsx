import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import permissionService from '../services/permissionService';
import supabase from '../backend/supabaseClient';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, user, appType, checkSession, logout } = useAuthStore();
  const location = useLocation();
  const [isWorkspaceExpired, setIsWorkspaceExpired] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkWorkspaceStatus = async () => {
      await checkSession();
      
      if (!isAuthenticated || appType !== 'business') {
        if (isMounted) {
          setIsAuthorized(false);
          setIsChecking(false);
        }
        return;
      }

      if (user?.workspaceId) {
        try {
          const { data, error } = await supabase
            .from('workspaces')
            .select('status')
            .eq('id', user.workspaceId)
            .maybeSingle();
          
          if (!error && data?.status === 'Expired') {
            setIsWorkspaceExpired(true);
          } else if (!error && data?.status !== 'Active') {
            setIsAuthorized(false);
            if (appType === 'business') {
              let msg = 'Your workspace is no longer active.';
              if (data?.status === 'Suspended') msg = 'Your workspace has been suspended.';
              if (data?.status === 'Disabled') msg = 'Your workspace has been disabled.';
              await logout(msg);
            }
          } else {
             setIsAuthorized(true);
          }
        } catch (err) {
          console.error('Failed to check workspace status', err);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
      
      if (isMounted) setIsChecking(false);
    };
    checkWorkspaceStatus();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname, checkSession, isAuthenticated, appType, user, logout]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
     if (isAuthenticated && appType === 'admin') {
       return <Navigate to="/adminpanel" replace />;
     }
     return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isWorkspaceExpired) {
    return <Navigate to="/expired" replace />;
  }

  // Enforce module-level permission checks
  const moduleKey = permissionService.getModuleKeyFromPath(location.pathname);
  if (moduleKey && !permissionService.hasModuleAccess(user, moduleKey)) {
    console.warn(`Unauthorized access attempt to ${location.pathname}. Redirecting to a permitted route.`);
    
    const perms = permissionService.getPermissions(user);
    if (perms.dashboard) {
      return <Navigate to="/" replace />;
    }
    
    const routeMap: Record<string, string> = {
      pos: '/pos',
      inventory: '/inventory',
      customers: '/customers',
      sales: '/sales-history',
      returns: '/returns',
      purchases: '/purchases',
      suppliers: '/suppliers',
      expenses: '/expenses',
      reports: '/reports',
      notifications: '/notifications',
      settings: '/settings'
    };

    const firstAllowedModule = Object.keys(perms).find(
      (k) => perms[k as keyof typeof perms] === true && routeMap[k]
    );

    if (firstAllowedModule && routeMap[firstAllowedModule]) {
      return <Navigate to={routeMap[firstAllowedModule]} replace />;
    }

    // If absolutely no modules are allowed, force log out the user
    logout();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
