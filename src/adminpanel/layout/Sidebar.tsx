import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  Megaphone, 
  Bell, 
  Settings, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const navItems = [
  { name: 'Dashboard', path: '/adminpanel', icon: LayoutDashboard, exact: true },
  { name: 'Workspaces', path: '/adminpanel/workspaces', icon: Briefcase },
  { name: 'Users', path: '/adminpanel/users', icon: Users },
  { name: 'Analytics', path: '/adminpanel/analytics', icon: BarChart3 },
  { name: 'Announcements', path: '/adminpanel/announcements', icon: Megaphone },
  { name: 'Notifications', path: '/adminpanel/notifications', icon: Bell },
  { name: 'Platform Settings', path: '/adminpanel/settings', icon: Settings },
  { name: 'Audit Logs', path: '/adminpanel/audit-logs', icon: ShieldAlert },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  return (
    <div 
      className={`relative flex flex-col bg-[#0e121b] border-r border-gray-800 transition-all duration-300 ease-in-out z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">CP</span>
            </div>
            <span className="text-white font-semibold text-lg whitespace-nowrap">Platform Admin</span>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">CP</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800 flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
