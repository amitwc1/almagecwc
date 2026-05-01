import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#003366', '#0ea5e9', '#8b5cf6', '#f59e0b'];

const AdminDashboardPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState({ role: '', status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (token) {
      adminService.getStats(token).then(data => setStats(data)).catch(() => {});
      loadUsers();
    }
  }, [token]);

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(token, { ...userFilter, page, limit: 15 });
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(1); }, [userFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await adminService.updateUserStatus(id, status, token);
      toast.success(`User ${status === 'banned' ? 'banned' : status === 'active' ? 'activated' : 'set to pending'}`);
      loadUsers(currentPage);
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await adminService.deleteUser(id, token);
      toast.success('User deleted');
      loadUsers(currentPage);
    } catch { toast.error('Failed to delete user'); }
  };

  const statCards = stats ? [
    { label: 'Total Alumni', value: stats.totalAlumni, icon: 'group', trend: '12%', up: true, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Students', value: stats.totalStudents, icon: 'person_pin', trend: '5%', up: true, color: 'text-purple-600 bg-purple-100' },
    { label: 'Jobs Posted', value: stats.totalJobs, icon: 'work', trend: '8%', up: true, color: 'text-green-600 bg-green-100' },
    { label: 'Total Events', value: stats.totalEvents, icon: 'event', trend: '18%', up: true, color: 'text-orange-600 bg-orange-100' },
    { label: 'Active Now', value: stats.activeUsers, icon: 'radio_button_checked', color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Applications', value: stats.totalApplications, icon: 'description', color: 'text-cyan-600 bg-cyan-100' },
    { label: 'Pending Users', value: stats.pendingUsers, icon: 'hourglass_top', color: 'text-yellow-600 bg-yellow-100' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: 'block', color: 'text-red-600 bg-red-100' },
  ] : [];

  return (
    <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen flex">
      <Sidebar type="admin" />
      <main className="flex-1 ml-0 lg:ml-72 flex flex-col overflow-x-hidden">
        <header className="h-16 border-b border-primary/10 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold dark:text-white">Admin Dashboard</h2>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {!stats ? [1,2,3,4].map(i => <SkeletonCard key={i} type="stat" />) :
              statCards.map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-primary/5 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <h3 className="text-2xl font-bold mt-1 dark:text-white">{(s.value || 0).toLocaleString()}</h3>
                    </div>
                    <div className={`p-2.5 rounded-lg ${s.color}`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                  </div>
                  {s.trend && (
                    <div className="mt-3 flex items-center gap-1">
                      <span className={`text-xs font-bold ${s.up ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="material-symbols-outlined text-xs">{s.up ? 'trending_up' : 'trending_down'}</span> {s.trend}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">vs last month</span>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-primary/5 dark:border-slate-700">
              <h4 className="text-lg font-bold dark:text-white mb-4">Registration Trends</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats?.monthlyTrends || []}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Bar dataKey="count" fill="#003366" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-primary/5 dark:border-slate-700">
              <h4 className="text-lg font-bold dark:text-white mb-4">User Distribution</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats?.roleDistribution || []} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={100} label={({ role, count }) => `${role} (${count})`}>
                    {(stats?.roleDistribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-primary/5 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-primary/5 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-bold dark:text-white">User Management</h4>
              <div className="flex gap-2 flex-wrap">
                <input placeholder="Search users..." value={userFilter.search} onChange={e => setUserFilter({...userFilter, search: e.target.value})} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                <select value={userFilter.role} onChange={e => setUserFilter({...userFilter, role: e.target.value})} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={userFilter.status} onChange={e => setUserFilter({...userFilter, status: e.target.value})} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">{u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <span className="text-sm font-semibold dark:text-white">{u.name}</span>
                        {u.is_online && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : u.role === 'alumni' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.status || 'active'}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {u.status !== 'active' && u.role !== 'admin' && (
                            <button onClick={() => handleStatusChange(u.id, 'active')} className="p-1 hover:text-green-500 transition-colors" title="Activate">
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                          )}
                          {u.status !== 'banned' && u.role !== 'admin' && (
                            <button onClick={() => handleStatusChange(u.id, 'banned')} className="p-1 hover:text-orange-500 transition-colors" title="Ban">
                              <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button onClick={() => handleDelete(u.id)} className="p-1 hover:text-red-500 transition-colors" title="Delete">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-3 border-t border-primary/5 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={currentPage <= 1} onClick={() => loadUsers(currentPage - 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">Prev</button>
                <button disabled={currentPage >= totalPages} onClick={() => loadUsers(currentPage + 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
