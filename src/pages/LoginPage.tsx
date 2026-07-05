import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Sparkles, TrendingUp, ShoppingBag, Landmark, Key } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isUrdu = i18n.language === 'ur';

  const { loginBusiness, isAuthenticated, loginError, clearLoginError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const { appType } = useAuthStore.getState();
      if (appType === 'admin') {
        navigate('/adminpanel', { replace: true });
        return;
      }
      if (appType === 'business') {
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location]);

  // Clean up error state when email/password change
  useEffect(() => {
    setFormError('');
    if (loginError) {
      clearLoginError();
    }
  }, [email, password, clearLoginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    if (!email.trim()) {
      setFormError('Please enter your email address or username.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await loginBusiness(email.trim(), password, rememberMe);
      if (success) {
        const { appType } = useAuthStore.getState();
        if (appType === 'admin') {
          navigate('/adminpanel', { replace: true });
          return;
        }
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setFormError('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [showForgotScreen, setShowForgotScreen] = useState(false);

  const handleForgotPassword = () => {
    setShowForgotScreen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* LEFT SIDE: Login Form (Stripe/Linear Feel) */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-16 lg:p-24 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
        
        {/* Top: Brand Header */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-10 md:mb-0">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white transform hover:rotate-6 transition-transform">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Counter<span className="text-blue-600">Pro</span>
            </span>
            <span className="text-[10px] block font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase -mt-1">
              {isUrdu ? 'پوائنٹ آف سیل' : 'Premium Retail POS'}
            </span>
          </div>
        </div>

        {/* Center: Auth Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {showForgotScreen ? (
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Key className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {isUrdu ? 'پاس ورڈ کی بازیابی' : 'Password Recovery'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isUrdu 
                    ? 'آن لائن پاس ورڈ کی بازیابی (ای میل یا ایس ایم ایس کے ذریعے) آنے والے کلاؤڈ اپ ڈیٹ میں دستیاب ہوگی۔'
                    : 'Cloud-based password recovery via email or SMS verification will be available in a future update.'}
                </p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isUrdu
                  ? 'براہ کرم اپنے اسٹور کے ایڈمنسٹریٹر سے رابطہ کریں جو سیٹنگز کے عملہ مینیجر سے آپ کا پاس ورڈ دوبارہ ترتیب دے سکتا ہے۔'
                  : 'For this local workspace release, please request your workspace administrator to reset your password from the Settings → Staff tab.'}
              </div>

              <button
                onClick={() => setShowForgotScreen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition"
              >
                {isUrdu ? 'لاگ ان پر واپس جائیں' : 'Back to Login'}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                  {isUrdu ? 'خوش آمدید' : 'Sign in to workspace'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isUrdu
                    ? 'اپنے کاؤنٹر پرو اکاؤنٹ میں سائن ان کریں'
                    : 'Enter your credentials below to access your local dashboard.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {isUrdu ? 'ای میل ایڈریس / صارف نام' : 'Email Address'}
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                    placeholder={isUrdu ? 'مثال: admin@counterpro.com' : 'e.g. admin@counterpro.com or admin'}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'پاس ورڈ' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {isUrdu ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password?'}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer group">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-slate-50 dark:bg-slate-800 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                      {isUrdu ? 'مجھے یاد رکھیں' : 'Remember me'}
                    </span>
                  </label>
                </div>

                {/* Error States */}
                {(formError || loginError) && (
                  <div className="flex items-start space-x-3 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 animate-shake">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-medium">{formError || loginError}</div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/80 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none transition-all outline-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{isUrdu ? 'تصدیق ہو رہی ہے...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isUrdu ? 'لاگ ان کریں' : 'Sign In'}</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          <span>© {new Date().getFullYear()} Swat Shop POS</span>
          <span className="flex items-center space-x-1.5 rtl:space-x-reverse">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>{isUrdu ? 'محفوظ کنکشن' : 'Secure Database Connection'}</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: SaaS Dashboard Art / Graphic Overlay (Stripe/Linear Style) */}
      <div className="hidden md:flex w-1/2 bg-slate-950 text-white items-center justify-center p-12 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Abstract Grid Line Overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        {/* Graphic & Copy Container */}
        <div className="max-w-md w-full relative z-10 space-y-12">
          
          {/* Glassmorphic Floating Dashboard Widget Group */}
          <div className="space-y-6">
            
            {/* Widget 1: Live Revenue KPI */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-1 px-2.5 rounded-full flex items-center space-x-1">
                  <span>+18.2%</span>
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {isUrdu ? 'آج کی فروخت' : 'Live Revenue Daily Stream'}
              </p>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-1">
                Rs. 182,490
              </h3>
            </div>

            {/* Widget 2: Shopping Cart Overview */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-2xl ml-8 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold tracking-wide">
                  {isUrdu ? 'سرگرم فروخت' : 'Active Checkout Terminal'}
                </span>
              </div>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Swat Honey (Wild Organic)</span>
                  <span className="text-slate-400">2 × Rs. 1,200</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
                  <span className="text-slate-300">Peshawari Chappal (Brown leather)</span>
                  <span className="text-slate-400">1 × Rs. 3,500</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold pt-1">
                  <span>{isUrdu ? 'کل رقم' : 'Net Total'}</span>
                  <span className="text-blue-400">Rs. 5,900</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Quick Status Info */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 py-3.5 px-5 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Swat Main Server Online</span>
              </span>
              <span className="flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>CPDS v1.2 Enabled</span>
              </span>
            </div>

          </div>

          {/* Core Branding Copy */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {isUrdu ? 'تیز ترین انوینٹری اور فروخت کا نظام' : 'Swiftest retail terminal system.'}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isUrdu
                ? 'کاؤنٹر پرو آپ کے خوردہ کاروبار کو جدید رفتار، گہرائی سے تجزیات، اور محفوظ ڈیٹا بیس کے ساتھ طاقتور بناتا ہے۔'
                : 'Khata Book has transitioned. Empower Swat local retail stores with real-time analytics, lightweight offline storage, and modern billing templates.'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;