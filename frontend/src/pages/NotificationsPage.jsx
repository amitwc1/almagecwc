import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
    }

    // Navigation logic
    switch (notification.type) {
      case 'message':
        navigate(`/messages/${notification.reference_id || ''}`);
        break;
      case 'connection':
        navigate('/connections/requests');
        break;
      case 'job':
        navigate('/jobs');
        break;
      case 'event':
        navigate('/events');
        break;
      case 'mentorship':
        navigate('/mentorship');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Stay updated with your network activity</p>
          </div>
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-all shadow-sm"
          >
            Mark all as read
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-20 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-6">notifications_off</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No notifications yet</h3>
            <p className="text-slate-500 dark:text-slate-400">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-start gap-5 ${!n.is_read ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  n.type === 'message' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                  n.type === 'connection' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' :
                  n.type === 'job' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                  'bg-slate-50 text-slate-600 dark:bg-slate-900/20'
                }`}>
                  <span className="material-symbols-outlined text-[28px]">
                    {n.type === 'message' ? 'chat' : 
                     n.type === 'connection' ? 'person_add' : 
                     n.type === 'job' ? 'work' : 'notifications'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{n.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{n.message}</p>
                </div>
                {!n.is_read && (
                  <div className="w-3 h-3 bg-primary rounded-full shrink-0 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
