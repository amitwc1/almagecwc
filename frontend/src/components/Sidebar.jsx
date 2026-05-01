import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ type = 'alumni' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const alumniLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'person', label: 'Profile', path: `/profile/${user?.id}` },
    { icon: 'group', label: 'Directory', path: '/directory' },
    { icon: 'work', label: 'Jobs', path: '/jobs' },
    { icon: 'handshake', label: 'Mentorship', path: '/mentorship' },
    { icon: 'calendar_today', label: 'Events', path: '/events' },
    { icon: 'chat', label: 'Messages', path: '/messages' },
  ];

  const adminLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin' },
    { icon: 'group', label: 'Alumni Directory', path: '/directory' },
    { icon: 'work', label: 'Job Board', path: '/jobs' },
    { icon: 'event', label: 'Events', path: '/events' },
    { icon: 'chat', label: 'Messages', path: '/messages' },
  ];

  const links = type === 'admin' ? adminLinks : alumniLinks;

  return (
    <aside className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden lg:flex flex-col fixed h-full overflow-y-auto">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-primary dark:text-white">
            {type === 'admin' ? 'AlumniAdmin' : 'AlumniCore'}
          </span>
        </Link>
        {user && (
          <div className="flex items-center gap-3 px-3 py-4 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-sm font-bold truncate dark:text-white">{user.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <nav className="flex flex-col gap-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Main Menu</p>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === link.path
                  ? 'bg-primary text-white font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
