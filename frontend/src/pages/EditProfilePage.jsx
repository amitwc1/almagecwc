import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import { extractErrorMessage } from '../services/authService';
import { toast } from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

const EditProfilePage = () => {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Form States
  // Form States
  // Form States
  const [basicInfo, setBasicInfo] = useState({
    name: '', 
    phone: '', 
    bio: '', 
    location: '', 
    department: '', 
    graduation_year: '',
    roll_number: '',
    linkedin: '', 
    github: '', 
    portfolio: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getMe();
      const p = data.data;
      setProfile(p);
      setBasicInfo({
        name: p.name || '',
        phone: p.phone || '',
        bio: p.bio || '',
        location: p.location || '',
        department: p.department || '',
        graduation_year: p.graduation_year || '',
        roll_number: p.roll_number || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        portfolio: p.portfolio || ''
      });
      if (p.profile_image) {
        const imgUrl = p.profile_image.startsWith('http') 
          ? p.profile_image 
          : `${import.meta.env.VITE_API_URL || ''}${p.profile_image}`;
        setImagePreview(imgUrl);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const fields = ['name', 'phone', 'bio', 'location', 'department', 'graduation_year', 'roll_number', 'linkedin'];
    const completed = fields.filter(f => basicInfo[f]).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBasicInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(basicInfo).forEach(key => {
        let value = basicInfo[key];
        if (key === 'roll_number' && value) {
          value = value.trim().toUpperCase();
        }
        formData.append(key, value);
      });
      if (profileImage) formData.append('profile_image', profileImage);

      await profileService.updateProfile(formData);
      toast.success("Profile updated successfully");
      await refreshUser();
      fetchProfile();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pt-20 text-center">Loading...</div>;

  const years = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);
  const completion = calculateCompletion();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Edit Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Keep your professional identity up to date</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Sections Navigation */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Profile Completion</h3>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="text-xs font-bold text-primary">{completion}% Complete</p>
              {completion < 100 && (
                <p className="text-[10px] text-slate-500 mt-2 italic">Fill all fields to appear higher in searches</p>
              )}
            </div>

            <div className="space-y-2">
              {['Basic Info', 'Education', 'Experience', 'Skills'].map((section) => (
                <button
                  key={section}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${section === 'Basic Info' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary border border-slate-200 dark:border-slate-700 shadow-sm'}`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Section Forms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Info Form */}
            <form onSubmit={handleSaveBasicInfo} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <img
                    src={imagePreview || '/default-avatar.png'}
                    alt="Preview"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20 bg-slate-50"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <span className="material-symbols-outlined">upload</span>
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Profile Photo</h3>
                  <p className="text-xs text-slate-500 mt-1">Recommended: Square image, max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={basicInfo.name}
                    onChange={handleBasicInfoChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={basicInfo.phone}
                    onChange={handleBasicInfoChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="+91 00000 00000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={basicInfo.location}
                    onChange={handleBasicInfoChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="e.g. Patna, India"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">College Roll Number</label>
                  <input
                    type="text"
                    name="roll_number"
                    value={basicInfo.roll_number}
                    onChange={handleBasicInfoChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="e.g. GEC2020CIV001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Primary Department</label>
                  <select
                    name="department"
                    value={basicInfo.department}
                    onChange={handleBasicInfoChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary outline-none"
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Graduation Year</label>
                  <select
                    name="graduation_year"
                    value={basicInfo.graduation_year}
                    onChange={handleBasicInfoChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary outline-none"
                  >
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">About / Bio</label>
                  <textarea
                    name="bio"
                    value={basicInfo.bio}
                    onChange={handleBasicInfoChange}
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Tell us about your professional journey..."
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">LinkedIn</label>
                      <input type="url" name="linkedin" value={basicInfo.linkedin} onChange={handleBasicInfoChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GitHub</label>
                      <input type="url" name="github" value={basicInfo.github} onChange={handleBasicInfoChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Portfolio</label>
                      <input type="url" name="portfolio" value={basicInfo.portfolio} onChange={handleBasicInfoChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Education and Experience will be handled by sub-components or sections */}
            <EducationSection userId={profile.user_id} education={profile.education} onUpdate={fetchProfile} />
            <ExperienceSection userId={profile.user_id} experience={profile.experience} onUpdate={fetchProfile} />
            <SkillsSection userId={profile.user_id} skills={profile.skills} onUpdate={fetchProfile} />
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎓 Sub-components for Education, Experience, Skills
const EducationSection = ({ education, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ college: '', degree: '', branch: '', start_year: '', end_year: '' });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await profileService.updateEducation(editingId, formData);
        toast.success("Education updated");
      } else {
        await profileService.addEducation(formData);
        toast.success("Education added");
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ college: '', degree: '', branch: '', start_year: '', end_year: '' });
      onUpdate();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleEdit = (edu) => {
    setFormData(edu);
    setEditingId(edu.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this education entry?")) return;
    try {
      await profileService.deleteEducation(id);
      toast.success("Deleted");
      onUpdate();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Education</h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="text-primary font-bold text-sm flex items-center gap-1">
            <span className="material-symbols-outlined">add</span> Add
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-4">
          <input type="text" placeholder="College Name" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Degree" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} required className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
            <input type="text" placeholder="Branch" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Start Year" value={formData.start_year} onChange={e => setFormData({...formData, start_year: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
            <input type="number" placeholder="End Year" value={formData.end_year} onChange={e => setFormData({...formData, end_year: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-1.5 text-slate-500 text-sm font-bold">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {education.map(edu => (
          <div key={edu.id} className="flex justify-between items-start border-b border-slate-50 dark:border-slate-700 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{edu.college}</h4>
              <p className="text-sm text-slate-500">{edu.degree}, {edu.branch}</p>
              <p className="text-xs text-slate-400 mt-0.5">{edu.start_year} - {edu.end_year}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(edu)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
              <button onClick={() => handleDelete(edu.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExperienceSection = ({ experience, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    company: '', role: '', location: '', start_date: '', end_date: '', currently_working: false, description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await profileService.updateExperience(editingId, formData);
        toast.success("Experience updated");
      } else {
        await profileService.addExperience(formData);
        toast.success("Experience added");
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ company: '', role: '', location: '', start_date: '', end_date: '', currently_working: false, description: '' });
      onUpdate();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleEdit = (exp) => {
    setFormData({
      ...exp,
      start_date: exp.start_date ? new Date(exp.start_date).toISOString().split('T')[0] : '',
      end_date: exp.end_date ? new Date(exp.end_date).toISOString().split('T')[0] : ''
    });
    setEditingId(exp.id);
    setIsAdding(true);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Experience</h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="text-primary font-bold text-sm flex items-center gap-1">
            <span className="material-symbols-outlined">add</span> Add
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-4">
          <input type="text" placeholder="Company Name" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
          <input type="text" placeholder="Job Title / Role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Start Date</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">End Date</label>
              <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} disabled={formData.currently_working} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none disabled:opacity-50" />
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.currently_working} onChange={e => setFormData({...formData, currently_working: e.target.checked, end_date: e.target.checked ? '' : formData.end_date})} className="w-4 h-4 rounded text-primary" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Currently working here</span>
          </label>

          <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none resize-none" />
          
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-1.5 text-slate-500 text-sm font-bold">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {experience.map(exp => (
          <div key={exp.id} className="flex justify-between items-start border-b border-slate-50 dark:border-slate-700 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{exp.role}</h4>
              <p className="text-sm text-primary">{exp.company}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                {exp.currently_working ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(exp)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
              <button onClick={async () => { if(window.confirm("Delete this experience?")) { await profileService.deleteExperience(exp.id); onUpdate(); } }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SkillsSection = ({ skills, onUpdate }) => {
  const [newSkill, setNewSkill] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await profileService.addSkill(newSkill.trim());
      setNewSkill('');
      onUpdate();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await profileService.deleteSkill(id);
      onUpdate();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Skills</h2>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          placeholder="Add a skill (e.g. React)"
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:border-primary outline-none text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all">
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <div
            key={skill.id}
            className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-600 transition-all"
          >
            {skill.skill_name}
            <button onClick={() => handleDelete(skill.id)} className="text-slate-400 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditProfilePage;
