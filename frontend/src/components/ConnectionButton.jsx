import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import connectionService from '../services/connectionService';
import toast from 'react-hot-toast';

/**
 * ConnectionButton — displays dynamic Connect / Pending / Connected / Accept states
 * based on the relationship between the current user and the target user.
 * 
 * Props:
 *   targetUserId: number — the user to connect with
 *   onStatusChange: function — optional callback when status changes
 *   size: 'sm' | 'md' — button size variant
 */
const ConnectionButton = ({ targetUserId, onStatusChange, size = 'md' }) => {
  const { user, token } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | none | pending_sent | pending_received | accepted | self
  const [connectionData, setConnectionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token && targetUserId) {
      fetchStatus();
    }
  }, [user, token, targetUserId]);

  const fetchStatus = async () => {
    try {
      const data = await connectionService.getStatus(targetUserId, token);
      setStatus(data.status);
      setConnectionData(data.connection);
    } catch {
      setStatus('none');
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectionService.send(targetUserId, token);
      setStatus('pending_sent');
      toast.success('Connection request sent!');
      onStatusChange?.('pending_sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    }
    setLoading(false);
  };

  const handleRespond = async (responseStatus) => {
    if (!connectionData) return;
    setLoading(true);
    try {
      await connectionService.respond(connectionData.id, responseStatus, token);
      setStatus(responseStatus === 'accepted' ? 'accepted' : 'none');
      toast.success(responseStatus === 'accepted' ? 'Connection accepted!' : 'Request declined');
      onStatusChange?.(responseStatus);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    if (!connectionData) return;
    setLoading(true);
    try {
      await connectionService.remove(connectionData.id, token);
      setStatus('none');
      setConnectionData(null);
      toast.success('Connection removed');
      onStatusChange?.('none');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    }
    setLoading(false);
  };

  if (!user || status === 'self' || status === 'loading') return null;

  const isSmall = size === 'sm';
  const baseCls = `inline-flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all duration-200 ${
    isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  }`;

  if (status === 'none' || status === 'rejected') {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className={`${baseCls} bg-primary text-white hover:bg-primary/90 disabled:opacity-50 shadow-sm`}
      >
        <span className={`material-symbols-outlined ${isSmall ? 'text-sm' : 'text-lg'}`}>person_add</span>
        {loading ? 'Sending...' : 'Connect'}
      </button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <button
        disabled
        className={`${baseCls} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 cursor-default`}
      >
        <span className={`material-symbols-outlined ${isSmall ? 'text-sm' : 'text-lg'}`}>schedule</span>
        Pending
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleRespond('accepted')}
          disabled={loading}
          className={`${baseCls} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50`}
        >
          <span className={`material-symbols-outlined ${isSmall ? 'text-sm' : 'text-lg'}`}>check</span>
          Accept
        </button>
        <button
          onClick={() => handleRespond('rejected')}
          disabled={loading}
          className={`${baseCls} bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50`}
        >
          <span className={`material-symbols-outlined ${isSmall ? 'text-sm' : 'text-lg'}`}>close</span>
          Decline
        </button>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`${baseCls} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 cursor-default shadow-sm`}
        >
          <span className={`material-symbols-outlined ${isSmall ? 'text-sm' : 'text-lg'}`}>check_circle</span>
          {isSmall ? 'Connected' : 'Connected'}
        </div>
        <button
          onClick={handleRemove}
          disabled={loading}
          title="Remove Connection"
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-100 dark:border-slate-700"
        >
          <span className="material-symbols-outlined text-[20px]">person_remove</span>
        </button>
      </div>
    );
  }

  return null;
};

export default ConnectionButton;
