import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ShieldAlert, Mail, Phone, Calendar, Clock, MapPin, Monitor, MoreVertical, Edit, Shield, LogOut, Key, Trash2, Activity, Info, LogIn, Lock } from 'lucide-react';
import supabase from '../../backend/supabaseClient';

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Tabs
  const tabs = ['Overview', 'Workspace Info', 'Activity', 'Login History', 'Permissions', 'Audit Logs'];

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          workspaces!inner(id, name, slug, status),
          platform_admins(is_active)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setUser({
          ...data,
          workspaceName: data.workspaces?.name,
          isSuperAdmin: !!data.platform_admins?.[0]?.is_active
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: string) => {
    if (!window.confirm(`Are you sure you want to ${actionType.toLowerCase()} this user?`)) return;
    
    setActionLoading(true);
    try {
      if (actionType === 'Activate') {
        await supabase.rpc('admin_activate_user', { target_user_id: id });
      } else if (actionType === 'Suspend') {
        await supabase.rpc('admin_suspend_user', { target_user_id: id });
      } else if (actionType === 'Disable') {
        await supabase.rpc('admin_disable_user', { target_user_id: id });
      } else if (actionType === 'Delete') {
        await supabase.rpc('admin_delete_user', { target_user_id: id });
        navigate('/adminpanel/users');
        return;
      } else if (actionType === 'Force Logout') {
        await supabase.rpc('admin_force_logout_user', { target_user_id: id });
      } else if (actionType === 'Change Role') {
        const newRole = window.prompt('Enter new role (Owner, Admin, Cashier):', user.role);
        if (!newRole || !['Owner', 'Admin', 'Cashier'].includes(newRole)) {
          alert('Invalid role.');
          return;
        }
        await supabase.rpc('admin_change_workspace_role', { target_user_id: id, new_role: newRole });
      } else if (actionType === 'Transfer') {
        const newWorkspaceId = window.prompt('Enter the new Workspace ID (UUID):');
        if (!newWorkspaceId) return;
        await supabase.rpc('admin_transfer_user_workspace', { target_user_id: id, new_workspace_id: newWorkspaceId });
      } else if (actionType === 'Reset Password') {
        // We can send a password reset email if email exists
        if (user?.email) {
          await supabase.auth.resetPasswordForEmail(user.email);
          alert('Password reset email sent to the user.');
        } else {
          alert('User does not have an email address configured.');
        }
      }
      
      await fetchUserDetails();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${actionType.toLowerCase()} user.`);
    } finally {
      setActionLoading(false);
      setShowActionMenu(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">User not found</h2>
        <button onClick={() => navigate('/adminpanel/users')} className="mt-4 text-indigo-600 hover:text-indigo-500">
          Return to directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in font-sans">
      <button 
        onClick={() => navigate('/adminpanel/users')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Users
      </button>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              {user.profile_photo_url ? (
                <img src={user.profile_photo_url} alt="" className="w-24 h-24 rounded-xl object-cover border-4 border-white dark:border-[#161b22] shadow-sm bg-white" />
              ) : (
                <div className="w-24 h-24 rounded-xl border-4 border-white dark:border-[#161b22] shadow-sm bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-3xl shrink-0">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
              <div className="pb-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{user.name || user.username}</h1>
                  {user.isSuperAdmin && (
                    <span className="flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                      Platform Super Admin
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    user.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400' :
                    user.status === 'Suspended' ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-400' :
                    'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 text-sm">
                  <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {user.email || 'No email provided'}</span>
                  <span className="flex items-center"><User className="w-4 h-4 mr-1.5" /> @{user.username}</span>
                </div>
              </div>
            </div>
            
            <div className="relative pb-1">
              <button 
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#22272e] text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm text-sm"
              >
                Actions
                <MoreVertical className="w-4 h-4 ml-2 text-gray-400" />
              </button>
              
              {showActionMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-[#161b22] ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 z-10 border border-gray-200 dark:border-gray-800">
                  <div className="py-1">
                    {user.status !== 'Active' && (
                      <button onClick={() => handleAction('Activate')} className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-gray-100 dark:text-green-400 dark:hover:bg-gray-800">
                        <Activity className="mr-3 h-4 w-4" /> Activate User
                      </button>
                    )}
                    {user.status === 'Active' && (
                      <button onClick={() => handleAction('Suspend')} className="flex w-full items-center px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 dark:text-yellow-500 dark:hover:bg-gray-800">
                        <Lock className="mr-3 h-4 w-4" /> Suspend User
                      </button>
                    )}
                    <button onClick={() => handleAction('Disable')} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                      <Shield className="mr-3 h-4 w-4" /> Disable User
                    </button>
                    <button onClick={() => handleAction('Change Role')} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                      <Shield className="mr-3 h-4 w-4" /> Change Role
                    </button>
                    <button onClick={() => handleAction('Transfer')} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                      <MapPin className="mr-3 h-4 w-4" /> Transfer Workspace
                    </button>
                    <button onClick={() => handleAction('Reset Password')} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                      <Key className="mr-3 h-4 w-4" /> Reset Password
                    </button>
                    <button onClick={() => handleAction('Force Logout')} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                      <LogOut className="mr-3 h-4 w-4" /> Force Logout
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-800 my-1"></div>
                    <button onClick={() => handleAction('Delete')} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800">
                      <Trash2 className="mr-3 h-4 w-4" /> Delete User
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace</div>
              <div className="mt-1 font-medium text-gray-900 dark:text-white flex items-center">
                {user.workspaceName}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace Role</div>
              <div className="mt-1 font-medium text-gray-900 dark:text-white">{user.role}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created Date</div>
              <div className="mt-1 font-medium text-gray-900 dark:text-white flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</div>
              <div className="mt-1 font-medium text-gray-900 dark:text-white flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                {user.last_active ? new Date(user.last_active).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1117]/50 px-2 overflow-x-auto">
          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2
                  ${activeTab === tab 
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#161b22]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'Overview' && <OverviewTab user={user} />}
          {activeTab === 'Workspace Info' && <WorkspaceInfoTab user={user} />}
          {activeTab === 'Activity' && <ActivityTab userId={user.id} />}
          {activeTab === 'Login History' && <LoginHistoryTab userId={user.id} />}
          {activeTab === 'Permissions' && <PermissionsTab userId={user.id} workspaceId={user.workspace_id} />}
          {activeTab === 'Audit Logs' && <AuditLogsTab userId={user.id} />}
        </div>
      </div>
    </div>
  );
}

// Sub-components for tabs
function OverviewTab({ user }: { user: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-indigo-500" />
          Personal Details
        </h3>
        <dl className="space-y-4">
          <div className="bg-gray-50 dark:bg-[#0d1117] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{user.name || 'Not provided'}</dd>
          </div>
          <div className="bg-gray-50 dark:bg-[#0d1117] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{user.email || 'Not provided'}</dd>
          </div>
          <div className="bg-gray-50 dark:bg-[#0d1117] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium flex items-center">
              {user.phone || 'Not provided'}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-[#0d1117] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Title</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{user.job_title || 'Not provided'}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
          Preferences & Location
        </h3>
        <dl className="space-y-4">
          <div className="bg-gray-50 dark:bg-[#0d1117] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Language</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium uppercase">{user.preferred_language || 'EN'}</dd>
          </div>
          <div className="bg-gray-50 dark:bg-[#0d1117] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Zone</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{user.time_zone || 'UTC'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function WorkspaceInfoTab({ user }: { user: any }) {
  return (
    <div className="max-w-3xl">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workspace Assignment</h3>
      <div className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{user.workspaceName}</h4>
            <p className="text-sm text-gray-500 font-mono mt-1">ID: {user.workspace_id}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.workspaces?.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {user.workspaces?.status || 'Active'}
          </span>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned Role</div>
            <div className="font-semibold text-gray-900 dark:text-white text-lg">{user.role}</div>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Joined Workspace</div>
            <div className="font-semibold text-gray-900 dark:text-white text-lg">{new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => window.alert('Use the main actions menu to change role.')} className="text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
            Change Role
          </button>
          <button onClick={() => window.alert('Use the main actions menu to transfer workspace.')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 px-4 py-2 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/50">
            Transfer to another workspace
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginHistoryTab({ userId }: { userId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false })
        .limit(20);
      setHistory(data || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Logins</h3>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">IP Address</th>
              <th className="px-6 py-3">Device / Browser</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No login history recorded</td></tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(record.login_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      record.status === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {record.ip_address || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <span className="truncate max-w-[200px]" title={`${record.device} - ${record.browser}`}>
                      {record.browser || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionsTab({ userId, workspaceId }: { userId: string, workspaceId: string }) {
  const [perms, setPerms] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('cashier_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .single();
      setPerms(data || {});
      setLoading(false);
    }
    load();
  }, [userId, workspaceId]);

  if (loading) return <div className="p-4 text-gray-500">Loading permissions...</div>;

  const permissionKeys = Object.keys(perms || {}).filter(k => k.startsWith('can_'));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Business Permissions</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Read-Only</span>
      </div>
      {permissionKeys.length === 0 ? (
        <div className="text-gray-500 p-8 border border-gray-200 dark:border-gray-800 rounded-lg text-center bg-gray-50 dark:bg-[#0d1117]">
          No explicit business permissions configured for this user.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissionKeys.map(key => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-[#0d1117]">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace('can_', '').replace(/_/g, ' ')}
              </span>
              <div className={`w-10 h-6 rounded-full flex items-center p-1 ${perms[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${perms[key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityTab({ userId }: { userId: string }) {
  // Mocking activity since we may not have cross-module activity logs easily linked without complex queries
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Platform Activity</h3>
      <div className="text-gray-500 p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-[#0d1117]">
        <Activity className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        Activity timeline will appear here.
      </div>
    </div>
  );
}

function AuditLogsTab({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setLogs(data || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Audit Logs</h3>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No audit logs recorded for this user</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                      {log.entity_type || 'System'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {log.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
