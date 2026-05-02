import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import { extractErrorMessage } from '../services/authService';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ConnectionButton from '../components/ConnectionButton';

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileService.getPublicProfile(id);
      setProfile(data.data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 pt-20 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-40 bg-white dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 pt-24 pb-12 px-4">
      <Navbar />
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary to-blue-900"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12">
              <div className="relative">
                <img
                  src={profile.profile_image 
                    ? (profile.profile_image.startsWith('http') 
                        ? profile.profile_image 
                        : `${import.meta.env.VITE_API_URL || ''}${profile.profile_image}`)
                    : '/default-avatar.png'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 object-cover shadow-lg"
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.name) + '&background=random&color=fff&size=128'; }}
                />
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => navigate('/messages')}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                  Message
                </button>
                <ConnectionButton targetUserId={parseInt(id)} />
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {profile.name}
                <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">{profile.role}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                {profile.experience?.[0]?.role ? `${profile.experience[0].role} at ${profile.experience[0].company}` : profile.role === 'student' ? 'Student at GEC' : 'GEC Alumnus'}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-lg text-slate-400">location_on</span>
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-slate-400">mail</span>
                  {profile.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-slate-400">call</span>
                  {profile.phone ? (
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{profile.phone}</span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1 text-xs italic group relative cursor-help">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Connect to view contact
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg z-20">
                        Only connections can see contact details
                      </div>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                  <i className="fa-brands fa-linkedin text-xl"></i>
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white transition-colors">
                  <i className="fa-brands fa-github text-xl"></i>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        {profile.bio && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Experience Section */}
            {profile.experience?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Experience</h2>
                <div className="space-y-8">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-slate-400">corporate_fare</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{exp.role}</h3>
                        <p className="text-primary font-semibold text-sm">{exp.company}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                          {exp.currently_working ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                        </p>
                        {exp.description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Section */}
            {profile.education?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Education</h2>
                <div className="space-y-8">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-slate-400">school</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{edu.college}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">{edu.degree}, {edu.branch}</p>
                        <p className="text-xs text-slate-400 mt-1">{edu.start_year} - {edu.end_year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Skills Section */}
            {profile.skills?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-600"
                    >
                      {skill.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
