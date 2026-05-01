import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import mentorshipService from '../services/mentorshipService';
import toast from 'react-hot-toast';

/**
 * MentorshipModal — modal dialog to request mentorship from an alumni.
 * 
 * Props:
 *   mentor: { id, name, job_title, company } — the target alumni
 *   isOpen: boolean
 *   onClose: function
 *   onSuccess: function — optional callback after successful request
 */
const MentorshipModal = ({ mentor, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mentorshipService.request(
        mentor.id,
        message || 'I would love to connect for mentorship and learn from your experience.',
        token
      );
      toast.success('Mentorship request sent!');
      setMessage('');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg animate-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {mentor.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold">Request Mentorship</h3>
                <p className="text-sm text-blue-100">{mentor.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-primary text-lg">person</span>
            <span>{mentor.job_title}{mentor.company ? ` at ${mentor.company}` : ''}</span>
          </div>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">
            Your Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell them why you'd like their mentorship, what you're working on, and what you hope to learn..."
            rows={5}
            maxLength={1000}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{message.length}/1000</p>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorshipModal;
