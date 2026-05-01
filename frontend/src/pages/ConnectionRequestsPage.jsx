import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import connectionService from '../services/connectionService';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ConnectionRequestsPage = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await connectionService.getRequests(token);
      setRequests(res.data);
    } catch (err) {
      toast.error('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (connectionId, status) => {
    setProcessingId(connectionId);
    try {
      await connectionService.respond(connectionId, status, token);
      setRequests(requests.filter(r => r.connection_id !== connectionId));
      toast.success(status === 'accepted' ? 'Connection accepted!' : 'Request rejected');
      
      // Update badge count globally (handled by navigation component usually, 
      // but here we just update local state)
      window.dispatchEvent(new Event('connectionUpdate'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    } finally {
      setProcessingId(null);
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse flex items-center gap-4">
      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
      <div className="flex gap-2">
        <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Connection Requests</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your incoming professional connections</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
            {requests.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">group_add</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No pending requests</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              When someone wants to connect with you, their requests will appear here.
            </p>
            <Link to="/alumni" className="inline-flex items-center mt-6 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all">
              Discover Alumni
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.connection_id}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4 group"
              >
                <Link to={`/profile/${request.user_id}`} className="relative shrink-0">
                  <img 
                    src={request.avatar_url ? `${import.meta.env.VITE_API_URL || ''}${request.avatar_url}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random&color=fff`} 
                    alt={request.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform"
                  />
                </Link>
                
                <div className="flex-1 text-center sm:text-left">
                  <Link to={`/profile/${request.user_id}`} className="text-lg font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">
                    {request.name}
                  </Link>
                  <p className="text-sm font-medium text-primary uppercase tracking-wider text-[11px]">
                    {request.role === 'alumni' ? request.job_title || 'Alumnus' : 'Student'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
                    {request.company || 'Not specified'}
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleRespond(request.connection_id, 'accepted')}
                    disabled={processingId !== null}
                    className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(request.connection_id, 'rejected')}
                    disabled={processingId !== null}
                    className="flex-1 sm:flex-none px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionRequestsPage;
