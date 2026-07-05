import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, Building, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import supabase from '../../backend/supabaseClient';

interface TopNavProps {
  toggleMobileMenu: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ toggleMobileMenu }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    setShowResults(true);
    try {
      // 1. Search Workspaces by name or id
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name, logo_url')
        .or(`name.ilike.%${searchQuery}%,id.eq.${isValidUUID(searchQuery) ? searchQuery : '00000000-0000-0000-0000-000000000000'}`)
        .limit(5);

      // 2. Search Users by email (to find their workspace)
      const { data: users } = await supabase
        .from('users')
        .select('id, email, workspace_id, workspaces(id, name, logo_url)')
        .ilike('email', `%${searchQuery}%`)
        .limit(5);

      const combinedResults = new Map();
      
      workspaces?.forEach(w => {
        combinedResults.set(w.id, { type: 'Workspace', id: w.id, name: w.name, logo: w.logo_url });
      });

      users?.forEach(u => {
        if (u.workspaces) {
          const w: any = u.workspaces;
          if (!combinedResults.has(w.id)) {
            combinedResults.set(w.id, { type: 'Workspace (via Owner)', id: w.id, name: w.name, logo: w.logo_url, emailMatch: u.email });
          }
        }
      });

      setSearchResults(Array.from(combinedResults.values()).slice(0, 5));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const isValidUUID = (uuid: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  };

  const handleSelectResult = (workspaceId: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/adminpanel/workspaces/${workspaceId}`);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0">
      <div className="flex items-center flex-1">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Global Search */}
        <div className="max-w-md w-full hidden md:block relative" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search platform by Name, ID, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) setShowResults(true);
            }}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setShowResults(false); }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-sm text-gray-500 text-center flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {searchResults.map((res: any) => (
                    <li 
                      key={res.id} 
                      onClick={() => handleSelectResult(res.id)}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {res.logo ? <img src={res.logo} alt="" className="w-full h-full object-cover rounded"/> : <Building className="w-4 h-4 text-gray-500"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{res.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {res.type} {res.emailMatch && `• ${res.emailMatch}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-sm text-gray-500 text-center">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Placeholder */}
        <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#161b22]" />
        </button>

        {/* User Profile Menu */}
        <div className="relative group">
          <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 pr-1">
              {user?.name || user?.username || 'Super Admin'}
            </span>
          </button>

          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c2128] rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 dark:ring-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email || 'admin@counterpro.com'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role || 'Platform Super Admin'}</p>
            </div>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Profile Settings</a>
            <button 
              onClick={async () => {
                try {
                  const { logAudit } = await import('../utils/auditLogger');
                  await logAudit({
                    action: 'Platform Admin Logout',
                    module: 'Authentication',
                    description: 'Platform Admin logged out successfully',
                    severity: 'Info',
                    status: 'Success'
                  });
                } catch (e) {
                  console.error(e);
                }
                await logout();
                navigate('/adminpanel/login');
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
