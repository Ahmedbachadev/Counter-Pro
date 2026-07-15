import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isUrdu = i18n.language === 'ur';

  const { loginBusiness, loginError, clearLoginError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

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
      setFormError(isUrdu ? 'براہ کرم اپنا ای میل یا صارف نام درج کریں۔' : 'Please enter your email address or username.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setFormError(isUrdu ? 'براہ کرم اپنا پاس ورڈ درج کریں۔' : 'Please enter your password.');
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

        const from = (location.state as any)?.from?.pathname || '/dashboard';
        const target = (from === '/login' || from.startsWith('/adminpanel')) ? '/dashboard' : from;

        navigate(target, { replace: true });
      }
    } catch (err: any) {
      console.error("Authentication catch block triggered:", err);

      // Catch network-specific failures (Supabase connection dropped/offline)
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        setFormError(
          isUrdu
            ? 'سرور سے رابطہ قائم کرنے میں ناکامی۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں۔'
            : 'Network error: Unable to reach authentication server. Please check your internet connection.'
        );
      } else {
        setFormError(
          isUrdu
            ? 'لاگ ان کے دوران غیر متوقع خرابی پیش آئی۔ دوبارہ کوشش کریں۔'
            : 'An unexpected authentication error occurred. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between items-center p-6 antialiased selection:bg-blue-600 selection:text-white">

      {/* Top spacing to help center main layout visually */}
      <div className="hidden sm:block h-16" />

      {/* Main Centered Box Container */}
      <div className="w-full max-w-[360px] mx-auto my-auto py-8 flex flex-col items-center">

        {/* Expanded Logo and Bold Tagline Accent */}
        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <img
            src="/assets/primarylogo.png"
            alt="Counter Pro Logo"
            className="h-16 w-auto object-contain block"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {isUrdu ? 'ریٹیل، ری-انجینیئرڈ' : 'Retail, Re-engineered.'}
          </h1>
        </div>

        {/* Form Interactive Workspace */}
        <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username/Email Input Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {isUrdu ? 'ای میل ایڈریس / صارف نام' : 'Email Address'}
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 bg-white text-zinc-900 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-400 font-medium"
                placeholder={isUrdu ? 'مثال: admin@counterpro.com' : 'Enter your email or username'}
              />
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {isUrdu ? 'پاس ورڈ' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 bg-white text-zinc-900 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none placeholder:text-zinc-400 font-medium tracking-wide"
                placeholder="Enter workspace password"
              />
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 bg-white transition-all cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-medium text-zinc-400">
                  {isUrdu ? 'مجھے یاد رکھیں' : 'Keep me signed in'}
                </span>
              </label>
            </div>

            {/* Action Errors Panel */}
            {(formError || loginError) && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="text-xs font-medium">{formError || loginError}</div>
              </div>
            )}

            {/* Accent Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-1.5 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-150 text-xs tracking-wide"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <span>{isUrdu ? 'لاگ ان کریں' : 'Continue'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Clean Bottom Footer Line */}
      <div className="w-full max-w-[360px] flex justify-between items-center text-[11px] font-medium text-zinc-400 pt-8 border-t border-zinc-100">
        <span>© {new Date().getFullYear()} Swat Shop POS</span>
        <span className="flex items-center space-x-1 rtl:space-x-reverse">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
          <span>{isUrdu ? 'محفوظ کنکشن' : 'Secure platform link'}</span>
        </span>
      </div>
    </div>
  );
};

export default LoginPage;