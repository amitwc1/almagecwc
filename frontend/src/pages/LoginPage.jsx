import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for rate limiting
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  /**
   * Client-side validation before hitting the API.
   * Returns true if valid, false otherwise (sets fieldErrors state).
   */
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (countdown > 0) return; // Prevent submission during lockout
    setError('');

    // Validate before sending
    if (!validateForm()) return;

    setLoading(true);
    console.log('[LoginPage] Attempting login with:', { email: email.trim() });

    try {
      const data = await login(email.trim(), password);
      console.log('[LoginPage] Login successful:', data.user);

      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Use extractErrorMessage to get the REAL backend error
      const message = extractErrorMessage(err);
      
      // Handle Rate Limiting (429) specifically
      if (err.response?.status === 429) {
        setCountdown(60); // Lock for 60 seconds
        setError("Too many login attempts. Please wait 60 seconds before trying again.");
      } else {
        setError(message);
      }
      
      console.error('[LoginPage] Login failed:', message, err);
    } finally {
      setLoading(false);
    }
  };

  // Clear field error when user starts typing
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-background-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary dark:text-white">GEC Alumni</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Sign in to your alumni network account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 dark:border-slate-700 p-8">
          {/* Server / API error message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-start gap-3" role="alert">
              <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    fieldErrors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                  } dark:bg-slate-700 dark:text-white text-sm focus:ring-2 transition-colors`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    fieldErrors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                  } dark:bg-slate-700 dark:text-white text-sm focus:ring-2 transition-colors`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || countdown > 0}
              className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : countdown > 0 ? (
                `Try again in ${countdown}s`
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">Create Account</Link>
            </p>
          </div>
        </div>

        {/* Debug info (dev only) */}
        {import.meta.env.DEV && (
          <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-600">
            API: {import.meta.env.VITE_API_URL || '/api (proxy)'} • Env: {import.meta.env.MODE}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
