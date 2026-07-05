import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Users, Package, ShoppingCart, UserCheck, Search,
  Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight, Activity, Plus
} from 'lucide-react';
import supabase from '../../backend/supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkspaces: 0, activeWorkspaces: 0, expiredWorkspaces: 0, suspendedWorkspaces: 0,
    totalUsers: 0, onlineUsers: 0,
    totalProducts: 0, totalSales: 0, totalCustomers: 0, totalSuppliers: 0
  });
  
  const [recentWorkspaces, setRecentWorkspaces] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Period selector
  const [period, setPeriod] = useState('7 Days');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Workspaces Stats
      const { data: recentWorkspacesData, error: wsError } = await supabase
        .from('workspaces')
        .select('id, status, created_at, name, logo_url, is_lifetime, access_period')
        .order('created_at', { ascending: false })
        .limit(5);
        
      const { count: twCount } = await supabase.from('workspaces').select('*', { count: 'exact', head: true });
      const { count: awCount } = await supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('status', 'Active');
      const { count: ewCount } = await supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('status', 'Expired');
      const { count: swCount } = await supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('status', 'Suspended');
      
      const tw = twCount || 0;
      const aw = awCount || 0;
      const ew = ewCount || 0;
      const sw = swCount || 0;
      
      setRecentWorkspaces(recentWorkspacesData || []);

      // 2. Fetch Users Stats
      const { data: recentUsersData } = await supabase
        .from('users')
        .select('id, name, email, role, workspace_id, created_at, status, last_active, workspaces(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: tuCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: ouCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_active', fifteenMinsAgo);
      
      const tu = tuCount || 0;
      const ou = ouCount || 0;
      
      if (recentUsersData) {
        // Attach workspace name using relationship or fallback
        const mappedUsers = recentUsersData.map(u => ({
          ...u,
          workspaceName: u.workspaces?.name || 'Unknown'
        }));
        setRecentUsers(mappedUsers);
      } else {
        setRecentUsers([]);
      }

      // 3. Aggregate totals (using count)
      const [{ count: products }, { count: sales }, { count: customers }, { count: suppliers }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('suppliers').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalWorkspaces: tw, activeWorkspaces: aw, expiredWorkspaces: ew, suspendedWorkspaces: sw,
        totalUsers: tu, onlineUsers: ou,
        totalProducts: products || 0,
        totalSales: sales || 0,
        totalCustomers: customers || 0,
        totalSuppliers: suppliers || 0
      });

      // 4. Activity Logs (Mocking from recent items)
      const mockActivities = [];
      if (recentWorkspacesData) {
        mockActivities.push(...recentWorkspacesData.slice(0, 3).map(w => ({ type: 'Workspace Created', title: `Workspace ${w.name} was created`, date: w.created_at })));
      }
      if (recentUsersData) {
        mockActivities.push(...recentUsersData.slice(0, 2).map(u => ({ type: 'User Created', title: `User ${u.name} registered`, date: u.created_at })));
      }
      setActivities(mockActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, colorClass }: any) => (
    <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  // Quick CSS Bar Chart Component
  const BarChart = ({ title }: { title: string }) => {
    // Generate random heights for demo
    const bars = Array.from({ length: 14 }).map(() => Math.floor(Math.random() * 100) + 10);
    return (
      <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="h-40 flex items-end justify-between gap-1 sm:gap-2">
          {bars.map((h, i) => (
            <div key={i} className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t-sm hover:bg-indigo-500 transition-colors group relative" style={{ height: `${h}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {h}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{period === '7 Days' ? 'Sun' : 'Start'}</span>
          <span>{period === '7 Days' ? 'Sat' : 'End'}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Overview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time statistics across all Counter Pro tenants</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg p-1">
          {['7 Days', '30 Days', '90 Days', '12 Months'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Building} title="Total Workspaces" value={stats.totalWorkspaces} trend={12} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard icon={CheckCircle} title="Active Workspaces" value={stats.activeWorkspaces} colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} trend={8} colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard icon={UserCheck} title="Online Users" value={stats.onlineUsers} subtitle="Active in last 15m" colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={ShoppingCart} title="Total Sales" value={stats.totalSales} trend={24} colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Package} title="Total Products" value={stats.totalProducts} colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
        <StatCard icon={Users} title="Total Customers" value={stats.totalCustomers} colorClass="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" />
        <StatCard icon={Building} title="Total Suppliers" value={stats.totalSuppliers} colorClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" />
        <StatCard icon={AlertTriangle} title="Suspended" value={stats.suspendedWorkspaces} colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" />
        <StatCard icon={XCircle} title="Expired Workspaces" value={stats.expiredWorkspaces} colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Workspace Growth" />
        <BarChart title="User Growth" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workspaces */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Workspaces</h3>
            <button onClick={() => navigate('/adminpanel/workspaces')} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentWorkspaces.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">No workspaces found.</p>
                <button onClick={() => navigate('/adminpanel/workspaces')} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create First Workspace</button>
              </div>
            ) : (
              recentWorkspaces.map(w => (
                <div key={w.id} onClick={() => navigate(`/adminpanel/workspaces/${w.id}`)} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-lg font-bold">
                      {w.logo_url ? <img src={w.logo_url} className="w-full h-full object-cover rounded" alt=""/> : w.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{w.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{w.is_lifetime ? 'Lifetime' : w.access_period} • Created {new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    {w.status === 'Active' && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>}
                    {w.status === 'Expired' && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Expired</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/adminpanel/workspaces')} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/30">
                <Plus className="w-4 h-4" /> Create Workspace
              </button>
              <button onClick={() => navigate('/adminpanel/users')} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800">
                <Users className="w-4 h-4" /> View All Users
              </button>
              <button onClick={() => navigate('/adminpanel/workspaces')} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-100 dark:border-red-900/30">
                <XCircle className="w-4 h-4" /> Expired Workspaces
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Platform Activity</h3>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity.</p>
              ) : (
                activities.map((act, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {i !== activities.length - 1 && <div className="absolute left-2 top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>}
                    <div className="w-4 h-4 mt-1 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#161b22] shrink-0 z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{act.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(act.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Users</h3>
          <button onClick={() => navigate('/adminpanel/users')} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-[#0d1117]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Workspace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td></tr>
              ) : (
                recentUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {u.name ? u.name.charAt(0) : 'U'}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{u.workspaceName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {u.last_active ? new Date(u.last_active).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
