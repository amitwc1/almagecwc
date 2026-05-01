import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MentorshipModal from '../components/MentorshipModal';
import { useAuth } from '../context/AuthContext';
import alumniService from '../services/alumniService';
import mentorshipService from '../services/mentorshipService';
import toast from 'react-hot-toast';

const MentorshipPage = () => {
  const { user, token } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [activeTab, setActiveTab] = useState('mentors'); // mentors | requests

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alumniData, requestData] = await Promise.all([
        alumniService.getAll({ limit: 50 }),
        token ? mentorshipService.getMyRequests(token) : { data: [] }
      ]);
      setMentors((alumniData.data || alumniData || []).filter(a => a.id !== user?.id));
      setRequests(requestData.data || []);
    } catch { /* silently handle */ }
    setLoading(false);
  };

  const handleRespond = async (requestId, status) => {
    try {
      await mentorshipService.respond(requestId, status, token);
      toast.success(`Request ${status}!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    }
  };

  // Separate requests into categories
  const pendingReceived = requests.filter(r => r.mentor_id === user?.id && r.status === 'pending');
  const pendingSent = requests.filter(r => r.student_id === user?.id && r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const rejected = requests.filter(r => r.status === 'rejected');

  // Get existing request status for a mentor
  const getRequestStatus = (mentorId) => {
    const req = requests.find(r => r.mentor_id === mentorId && r.student_id === user?.id);
    return req ? req.status : null;
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      accepted: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight dark:text-white">Mentorship Program</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
            Connect with experienced alumni mentors who can guide your career journey.
          </p>
        </div>

        {/* Tab Navigation */}
        {user && (
          <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit mb-8">
            {[
              { id: 'mentors', label: 'Browse Mentors', icon: 'groups' },
              { id: 'requests', label: 'My Requests', icon: 'inbox', count: pendingReceived.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
                {tab.count > 0 && (
                  <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Browse Mentors Tab */}
        {activeTab === 'mentors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg mt-4" />
                </div>
              ))
            ) : mentors.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4">handshake</span>
                <p className="text-lg font-medium">No mentors available yet.</p>
                <p className="text-sm">Check back soon or encourage alumni to join the program.</p>
              </div>
            ) : mentors.map((mentor, i) => {
              const reqStatus = getRequestStatus(mentor.id);
              return (
                <div key={mentor.id || i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                      {mentor.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold dark:text-white truncate">{mentor.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {mentor.job_title}{mentor.company ? ` at ${mentor.company}` : ''}
                      </p>
                      {mentor.graduation_year && (
                        <p className="text-xs text-primary font-semibold">Class of {mentor.graduation_year}</p>
                      )}
                    </div>
                  </div>
                  {mentor.skills && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mentor.skills.split(',').slice(0, 4).map((s, j) => (
                        <span key={j} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  {user && user.role === 'student' && (
                    reqStatus === 'pending' ? (
                      <div className="flex items-center gap-2 py-2 text-amber-600 dark:text-amber-400 text-sm font-bold">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        Request Pending
                      </div>
                    ) : reqStatus === 'accepted' ? (
                      <div className="flex items-center gap-2 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Active Mentorship
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedMentor(mentor)}
                        className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">psychology</span>
                        Request Mentorship
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-8">
            {/* Pending Received (for alumni) */}
            {user?.role === 'alumni' && pendingReceived.length > 0 && (
              <div>
                <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">pending</span>
                  Pending Requests
                  <span className="ml-2 min-w-[22px] h-[22px] bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{pendingReceived.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReceived.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                          {req.student_name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm dark:text-white">{req.student_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{req.student_email}</p>
                        </div>
                        {statusBadge(req.status)}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg mb-4 italic">
                        "{req.message}"
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(req.id, 'accepted')}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">check</span> Accept
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, 'rejected')}
                          className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent (for students) */}
            {pendingSent.length > 0 && (
              <div>
                <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">outgoing_mail</span>
                  Sent Requests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingSent.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                          {req.mentor_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm dark:text-white truncate">{req.mentor_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {req.mentor_job_title}{req.mentor_company ? ` at ${req.mentor_company}` : ''}
                          </p>
                        </div>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted */}
            {accepted.length > 0 && (
              <div>
                <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">handshake</span>
                  Active Mentorships
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accepted.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/30 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          {(user?.id === req.student_id ? req.mentor_name : req.student_name)?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm dark:text-white truncate">
                            {user?.id === req.student_id ? req.mentor_name : req.student_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {user?.id === req.student_id ? 'Mentor' : 'Mentee'}
                          </p>
                        </div>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <div>
                <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">block</span>
                  Past Requests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rejected.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 opacity-60 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
                          {(user?.id === req.student_id ? req.mentor_name : req.student_name)?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm dark:text-white truncate">
                            {user?.id === req.student_id ? req.mentor_name : req.student_name}
                          </p>
                        </div>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {requests.length === 0 && (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4">inbox</span>
                <h3 className="text-xl font-bold mb-2">No mentorship requests yet</h3>
                <p className="text-sm">
                  {user?.role === 'student'
                    ? 'Browse mentors and send your first request!'
                    : 'Students will send you mentorship requests here.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Mentorship Modal */}
      <MentorshipModal
        mentor={selectedMentor}
        isOpen={!!selectedMentor}
        onClose={() => setSelectedMentor(null)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default MentorshipPage;
