import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import connectionService from '../services/connectionService';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user && token) {
      fetchCount();
      const interval = setInterval(fetchCount, 30000); // Check every 30s
      window.addEventListener('connectionUpdate', fetchCount);
      return () => {
        clearInterval(interval);
        window.removeEventListener('connectionUpdate', fetchCount);
      };
    }
  }, [user, token]);

  const fetchCount = async () => {
    try {
      const res = await connectionService.getPendingCount(token);
      setPendingCount(res.count);
    } catch {
      // Ignore
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined">school</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary dark:text-white">GEC Alumni</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Home</Link>
            <Link to="/directory" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Alumni Directory</Link>
            <Link to="/events" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Events</Link>
            <Link to="/jobs" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Jobs</Link>
            {user && <Link to="/mentorship" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Mentorship</Link>}
            {user && <Link to="/messages" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Messages</Link>}
            {user && (
              <Link to="/connections/requests" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors flex items-center gap-1.5">
                Connections
                {pendingCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-lg shadow-primary/20">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            {user && <Link to="/profile" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Profile</Link>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link to="/dashboard" className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary">Dashboard</Link>
              {user.role === 'admin' && <Link to="/admin" className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary">Admin</Link>}
              <button onClick={handleLogout} className="rounded-lg bg-primary/10 dark:bg-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-all">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-sm">Login</Link>
          )}
          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
            <span className="material-symbols-outlined dark:text-white">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 space-y-3 animate-in slide-in-from-top-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Home</Link>
          <Link to="/directory" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Alumni Directory</Link>
          <Link to="/events" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Events</Link>
          <Link to="/jobs" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Jobs</Link>
          {user && <Link to="/mentorship" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Mentorship</Link>}
          {user && <Link to="/messages" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Messages</Link>}
          {user && (
            <Link to="/connections/requests" onClick={() => setMobileOpen(false)} className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300 py-2">
              Connections
              {pendingCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-white">{pendingCount}</span>}
            </Link>
          )}
          {user && <Link to="/profile" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Profile</Link>}
          {user && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300 py-2">Dashboard</Link>}
        </div>
      )}
    </header>
  );
};

export default Navbar;
