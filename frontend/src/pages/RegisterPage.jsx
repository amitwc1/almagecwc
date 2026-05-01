import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/authService';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuth();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  /**
   * Client-side validation — matches backend Joi schemas.
   * Returns true if all fields are valid, false otherwise.
   */
  const validateForm = () => {
    const errors = {};

    // Name
    if (!form.name.trim()) {
      errors.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!validateForm()) return;

    setLoading(true);
    console.log('[RegisterPage] Attempting registration:', {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    });

    try {
      const data = await register(form.name.trim(), form.email.trim(), form.password, form.role);
      console.log('[RegisterPage] Registration successful:', data.user);
      navigate('/dashboard');
    } catch (err) {
      // Use extractErrorMessage for the REAL backend error
      const message = extractErrorMessage(err);
      
      // Handle Rate Limiting (429) specifically
      if (err.response?.status === 429) {
        setCountdown(60); // Lock for 60 seconds
        setError("Too many registration attempts. Please wait 60 seconds before trying again.");
      } else {
        setError(message);
      }
      
      console.error('[RegisterPage] Registration failed:', message, err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render a form field with error state
  const renderField = (name, label, icon, type, placeholder, extra) => (
    <div>
      <label htmlFor={`register-${name}`} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">{icon}</span>
        <input
          id={`register-${name}`}
          type={type === 'password' && showPassword ? 'text' : type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={`w-full pl-10 ${type === 'password' ? 'pr-12' : 'pr-4'} py-3 rounded-lg border ${
            fieldErrors[name]
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
          } dark:bg-slate-700 dark:text-white text-sm focus:ring-2 transition-colors`}
          placeholder={placeholder}
          autoComplete={extra?.autoComplete}
        />
        {type === 'password' && name === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {fieldErrors[name] && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">info</span>
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-background-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary dark:text-white">GEC Alumni</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create Account</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Join the GEC West Champaran alumni network</p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 dark:border-slate-700 p-8">
          {/* Server / API error message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-start gap-3" role="alert">
              <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {renderField('name', 'Full Name', 'person', 'text', 'John Doe', { autoComplete: 'name' })}
            {renderField('email', 'Email Address', 'mail', 'email', 'you@example.com', { autoComplete: 'email' })}

            {/* Role Selector */}
            <div>
              <label htmlFor="register-role" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {['student', 'alumni'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setForm((prev) => ({ ...prev, role })); if (error) setError(''); }}
                    className={`py-3 rounded-lg border text-sm font-semibold capitalize transition-all ${
                      form.role === role
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg align-middle mr-1">
                      {role === 'student' ? 'school' : 'work_history'}
                    </span>
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {renderField('password', 'Password', 'lock', 'password', 'Min 6 characters', { autoComplete: 'new-password' })}
            {renderField('confirmPassword', 'Confirm Password', 'lock', 'password', 'Re-enter password', { autoComplete: 'new-password' })}

            {/* Password strength indicator */}
            {form.password && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      form.password.length >= 12 ? 'w-full bg-green-500' :
                      form.password.length >= 8 ? 'w-2/3 bg-yellow-500' :
                      form.password.length >= 6 ? 'w-1/3 bg-orange-500' : 'w-1/6 bg-red-500'
                    }`}
                  ></div>
                </div>
                <span className={`text-[10px] font-bold ${
                  form.password.length >= 12 ? 'text-green-500' :
                  form.password.length >= 8 ? 'text-yellow-500' :
                  form.password.length >= 6 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {form.password.length >= 12 ? 'Strong' : form.password.length >= 8 ? 'Good' : form.password.length >= 6 ? 'Fair' : 'Weak'}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || countdown > 0}
              className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : countdown > 0 ? (
                `Try again in ${countdown}s`
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
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

export default RegisterPage;
