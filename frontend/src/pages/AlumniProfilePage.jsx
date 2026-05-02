import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ConnectionButton from '../components/ConnectionButton';
import MentorshipModal from '../components/MentorshipModal';
import { useAuth } from '../context/AuthContext';
import alumniService from '../services/alumniService';

const AlumniProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '', job_title: '', company: '',
    graduation_year: '', location: '',
    bio: '', skills: '', profile_image: ''
  });
  const [loading, setLoading] = useState(true);
  const [mentorshipOpen, setMentorshipOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    alumniService.getById(id)
      .then((data) => { setProfile(data.data || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const skillsArray = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const isOwnProfile = user && (user.id === parseInt(id));

  if (loading) {
    return (
      <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen">
      <Navbar />
      <main className="flex flex-1 justify-center py-8">
        <div className="flex flex-col max-w-[1024px] flex-1 px-4 md:px-10">
          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/5 dark:border-slate-700 overflow-hidden">
            <div className="h-32 w-full bg-gradient-to-r from-primary to-blue-900" />
            <div className="px-6 pb-6 -mt-12 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-800 shadow-md bg-cover bg-center bg-slate-100 dark:bg-slate-700"
                  style={{
                    backgroundImage: profile.profile_image 
                      ? `url("${profile.profile_image.startsWith('http') ? profile.profile_image : `${import.meta.env.VITE_API_URL || ''}${profile.profile_image}`}")` 
                      : 'none'
                  }}>
                  {!profile.profile_image && (
                    <div className="w-full h-full rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-4xl">
                      {profile.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col mb-2">
                  <h1 className="text-2xl font-bold leading-tight tracking-tight dark:text-white">{profile.name}</h1>
                  <p className="text-primary font-semibold">
                    {profile.graduation_year && `Class of ${profile.graduation_year} • `}
                    {profile.job_title}{profile.company && ` at ${profile.company}`}
                  </p>
                  {profile.location && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <p>{profile.location}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              {user && !isOwnProfile && (
                <div className="flex gap-3 mb-2 flex-wrap">
                  <button
                    onClick={() => navigate('/messages')}
                    className="flex items-center gap-2 px-4 h-10 bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">mail</span> Message
                  </button>
                  <ConnectionButton targetUserId={parseInt(id)} />
                </div>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Bio */}
              {profile.bio && (
                <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/5 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <span className="material-symbols-outlined text-primary">person</span> Professional Bio
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
                </section>
              )}
              {/* Career Timeline */}
              <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/5 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                  <span className="material-symbols-outlined text-primary">work</span> Career Timeline
                </h3>
                <div className="space-y-8 relative before:content-[''] before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10">
                  {[
                    { title: profile.job_title || 'Current Role', company: `${profile.company || 'Company'} • Present`, desc: 'Leading impactful work and driving innovation.', active: true },
                    { title: 'Previous Role', company: 'Previous Company • Earlier', desc: 'Built foundational skills and contributed to team success.' },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-12">
                      <div className={`absolute left-0 top-1 w-9 h-9 rounded-full ${item.active ? 'bg-primary' : 'bg-primary/20'} flex items-center justify-center ${item.active ? 'text-white' : 'text-primary'} z-10 border-4 border-white dark:border-slate-800`}>
                        <span className="material-symbols-outlined text-sm">{item.active ? 'apartment' : 'corporate_fare'}</span>
                      </div>
                      <div>
                        <h4 className="font-bold dark:text-white">{item.title}</h4>
                        <p className="text-sm text-primary font-medium">{item.company}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="flex flex-col gap-6">
              {/* Skills */}
              {skillsArray.length > 0 && (
                <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/5 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <span className="material-symbols-outlined text-primary">star</span> Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{skill}</span>
                    ))}
                  </div>
                </section>
              )}
              {/* Mentorship CTA */}
              {user && user.role === 'student' && !isOwnProfile && (
                <section className="bg-primary text-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-2">Looking for mentors?</h3>
                  <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                    {profile.name} may be open to mentoring. Feel free to reach out.
                  </p>
                  <button
                    onClick={() => setMentorshipOpen(true)}
                    className="w-full py-2.5 bg-white text-primary rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">psychology</span>
                    Request Mentorship
                  </button>
                </section>
              )}
              {/* LinkedIn */}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-primary/5 dark:border-slate-700 hover:shadow-md transition-shadow text-sm font-semibold text-primary">
                  <span className="material-symbols-outlined">link</span>
                  View LinkedIn Profile
                  <span className="material-symbols-outlined text-sm ml-auto">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Mentorship Modal */}
      <MentorshipModal
        mentor={profile}
        isOpen={mentorshipOpen}
        onClose={() => setMentorshipOpen(false)}
      />
    </div>
  );
};

export default AlumniProfilePage;
