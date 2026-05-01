import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import profileService from '../services/profileService';
import { extractErrorMessage } from '../services/authService';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getMe();
      setProfile(data.data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
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
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/10 dark:to-transparent"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12">
              <div className="relative">
                <img
                  src={profile.profile_image ? `${import.meta.env.VITE_API_URL || ''}${profile.profile_image}` : '/default-avatar.png'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 object-cover shadow-lg"
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + profile.name; }}
                />
              </div>
              <Link
                to="/profile/edit"
                className="mb-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit Profile
              </Link>
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {profile.name}
                {profile.role === 'alumni' && (
                  <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Alumni</span>
                )}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                {profile.experience?.[0]?.role ? `${profile.experience[0].role} at ${profile.experience[0].company}` : profile.role === 'student' ? 'Student' : 'GEC Alumnus'}
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
                {profile.phone && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-lg text-slate-400">call</span>
                    {profile.phone}
                  </div>
                )}
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
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">language</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {profile.bio || "No bio added yet. Tell people about yourself!"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Experience Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Experience</h2>
              </div>
              {profile.experience?.length > 0 ? (
                <div className="space-y-8">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="flex gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-slate-400">corporate_fare</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">{exp.role}</h3>
                        <p className="text-primary font-semibold text-sm">{exp.company}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                          {exp.currently_working ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">No experience entries found.</p>
              )}
            </div>

            {/* Education Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Education</h2>
              </div>
              {profile.education?.length > 0 ? (
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
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">No education entries found.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Skills Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-600"
                    >
                      {skill.skill_name}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm italic">Add skills to showcase your expertise.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
