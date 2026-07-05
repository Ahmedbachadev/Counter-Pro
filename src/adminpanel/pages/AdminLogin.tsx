import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import supabase from '../../backend/supabaseClient';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, isAuthenticated, appType, clearLoginError } = useAuthStore();

  useEffect(() => {
    // If arriving already authenticated as admin, go to admin panel.
    if (isAuthenticated && appType === 'admin' && !loading) {
      navigate('/adminpanel', { replace: true });
    }
  }, [isAuthenticated, appType, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    clearLoginError();

    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';

    try {
      const success = await loginAdmin(email, password, rememberMe);
      
      if (!success) {
        const errorText = useAuthStore.getState().loginError || 'Authentication failed';
        setErrorMsg(errorText);
        setLoading(false);
        // Log failed login via RPC since we are not authenticated
        supabase.rpc('log_failed_admin_login', {
          p_email: email,
          p_user_agent: userAgent
        }).catch(console.error);
        return;
      }
      
      // Log successful login
      await supabase.from('activity_logs').insert([{
        action: 'Platform Admin Login',
        module: 'Authentication',
        description: `Platform Admin logged in successfully`,
        severity: 'Info',
        status: 'Success',
        entity_type: 'Platform',
        entity_id: '00000000-0000-0000-0000-000000000000',
        user_agent: userAgent
      }]);
      
      navigate('/adminpanel', { replace: true });
    } catch (err: any) {
      console.error('Login flow error:', err);
      setErrorMsg(err.message || 'An error occurred during login');
      setLoading(false);
      // Log failed login via RPC
      supabase.rpc('log_failed_admin_login', {
        p_email: email,
        p_user_agent: userAgent
      }).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold tracking-tight">CP</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white tracking-tight">
            Platform Administration
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to manage Counter Pro workspaces
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-[#0d1117] text-white placeholder-gray-500 transition-colors"
                  placeholder="admin@counterpro.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-[#0d1117] text-white placeholder-gray-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-[#0d1117]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors" onClick={(e) => e.preventDefault()}>
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in securely'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
