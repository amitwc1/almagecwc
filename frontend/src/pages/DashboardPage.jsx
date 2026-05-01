import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { API_URL } from '../services/apiConfig';

const DashboardPage = () => {
  const { user, token } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ donations: 0, mentorshipHours: 0, referrals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const headers = { Authorization: `Bearer ${token}` };

      Promise.all([
        axios.get(`${API_URL}/mentorship/my-requests`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/events`, { headers }).catch(() => ({ data: { data: [] } })),
      ]).then(([mentRes, eventRes]) => {
        // Backend returns { success, data: [...] }
        const mData = mentRes.data?.data || (Array.isArray(mentRes.data) ? mentRes.data : []);
        const eData = eventRes.data?.data || (Array.isArray(eventRes.data) ? eventRes.data : []);
        
        setMentorships(mData);
        setEvents(eData.slice(0, 3));
        setLoading(false);
      }).catch(err => {
        console.error('[Dashboard] Data load failed:', err);
        setLoading(false);
      });
    }
  }, [token]);

  const handleMentorshipAction = async (id, status) => {
    try {
      await axios.put(`${API_URL}/mentorship/respond`, { request_id: id, status }, { headers: { Authorization: `Bearer ${token}` } });
      setMentorships(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    } catch (err) { console.error('[Dashboard] Mentorship action failed:', err); }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return { month: d.toLocaleString('en', { month: 'short' }).toUpperCase(), day: d.getDate() };
  };

  return (
    <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen flex">
      <Sidebar type="alumni" />
      <main className="flex-1 ml-0 lg:ml-72 flex flex-col overflow-x-hidden">
        <header className="h-16 border-b border-primary/10 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <div>
            <h2 className="text-lg font-bold dark:text-white">Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <div className="p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening in your alumni network.</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: 'handshake', label: 'Mentorships', value: mentorships.length, trend: 'Active', bg: 'bg-purple-100 text-purple-600' },
              { icon: 'event', label: 'Upcoming Events', value: events.length, trend: 'Scheduled', bg: 'bg-blue-100 text-blue-600' },
              { icon: 'military_tech', label: 'Badges Earned', value: user?.badges?.length || 0, trend: 'Points', bg: 'bg-orange-100 text-orange-600' },
            ].map((m, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                <div className="flex justify-between items-start mb-2">
                  <span className={`p-2 rounded-lg material-symbols-outlined ${m.bg}`}>{m.icon}</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400">{m.trend}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{m.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Network Engagement Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold dark:text-white">Network Engagement</h3>
                <select className="bg-slate-50 dark:bg-slate-700 border-none rounded-lg text-xs font-bold p-2 focus:ring-primary dark:text-white">
                  <option>Last 6 Months</option><option>Last Year</option>
                </select>
              </div>
              <div className="h-64 w-full relative flex items-end justify-between gap-2 pt-4">
                {[40, 60, 45, 85, 55, 70].map((h, i) => (
                  <div key={i} className="group relative flex-1 flex flex-col items-center gap-2">
                    <div className={`w-full rounded-t-lg transition-all ${i === 3 ? 'bg-primary/60 hover:bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`} style={{height: `${h}%`}}></div>
                    <span className={`text-[10px] font-bold ${i === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{['JAN','FEB','MAR','APR','MAY','JUN'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar content */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              {/* Upcoming Events */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-6 dark:text-white">Upcoming Events</h3>
                <div className="flex flex-col gap-6">
                  {loading ? [1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"></div>) :
                    events.length === 0 ? <p className="text-sm text-slate-400 dark:text-slate-500">No upcoming events</p> :
                    events.map((e) => {
                      const d = formatDate(e.event_date);
                      return (
                        <div key={e.id} className="flex gap-4 group cursor-pointer">
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shrink-0 group-hover:border-primary transition-colors">
                            <span className="text-xs font-bold text-primary uppercase">{d.month}</span>
                            <span className="text-xl font-black dark:text-white">{d.day}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm truncate dark:text-white">{e.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">location_on</span> {e.location || 'TBD'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>

              {/* Mentorship Requests */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-6 dark:text-white">
                  Mentorship <span className="inline-flex items-center justify-center w-5 h-5 bg-primary text-white text-[10px] rounded-full ml-1">{mentorships.filter(m => m.status === 'pending').length}</span>
                </h3>
                <div className="flex flex-col gap-5">
                  {mentorships.filter(m => m.status === 'pending' && m.mentor_id === user?.id).slice(0, 3).map(req => (
                    <div key={req.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {req.student_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <h4 className="text-sm font-bold dark:text-white">{req.student_name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{req.message?.slice(0, 50)}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleMentorshipAction(req.id, 'accepted')} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-md">Accept</button>
                          <button onClick={() => handleMentorshipAction(req.id, 'rejected')} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">Decline</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {mentorships.filter(m => m.status === 'pending' && m.mentor_id === user?.id).length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500">No pending requests</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
