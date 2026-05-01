import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkeletonCard from '../components/SkeletonCard';
import alumniService from '../services/alumniService';
import AlumniCard from '../components/AlumniCard';

const AlumniDirectoryPage = () => {
  // 1. Raw Input State (for immediate UI updates)
  const [inputs, setInputs] = useState({
    name: '',
    company: '',
    location: '',
    skills: '',
    department: '',
    graduationYear: '',
    rollNumber: ''
  });

  // 2. Filter State (used for API calls, debounced)
  const [filters, setFilters] = useState({
    name: '',
    company: '',
    location: '',
    skills: '',
    department: '',
    graduationYear: '',
    rollNumber: ''
  });

  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const gradients = ['from-primary to-primary/60', 'from-slate-700 to-slate-500', 'from-indigo-800 to-indigo-500', 'from-red-800 to-red-500', 'from-blue-900 to-blue-600', 'from-emerald-800 to-emerald-500'];

  // 3. Debounce Logic for Text Inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        name: inputs.name,
        company: inputs.company,
        location: inputs.location,
        skills: inputs.skills,
        rollNumber: inputs.rollNumber
      }));
      setPage(1); // Reset to page 1 when text filters change
    }, 500);

    return () => clearTimeout(handler);
  }, [inputs.name, inputs.company, inputs.location, inputs.skills, inputs.rollNumber]);

  // 4. Immediate update for dropdowns
  const handleDropdownChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const loadAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params = { 
        page, 
        limit: 10,
        ...filters
      };
      // Remove empty params
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const data = await alumniService.getAll(params);
      setAlumni(data.data || []);
      setPagination({
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      });
    } catch (err) {
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  const clearFilters = () => {
    const reset = { name: '', company: '', location: '', skills: '', department: '', graduationYear: '', rollNumber: '' };
    setInputs(reset);
    setFilters(reset);
    setPage(1);
  };

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="bg-[#f5f7f8] dark:bg-[#0f1923] min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row max-w-[1440px] mx-auto w-full px-4 md:px-10 py-8 gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-72 shrink-0 space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">filter_list</span>
                Filters
              </h2>
              <button onClick={clearFilters} className="text-xs font-bold text-primary hover:underline">Reset All</button>
            </div>

            <div className="space-y-5">
              {/* Roll Number Search */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">College Roll No</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">fingerprint</span>
                  <input 
                    value={inputs.rollNumber} 
                    onChange={e => setInputs({...inputs, rollNumber: e.target.value})} 
                    placeholder="Exact Roll No. (GEC...)" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 transition-all dark:text-white" 
                  />
                </div>
              </div>

              {/* Name Search */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Search Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
                  <input 
                    value={inputs.name} 
                    onChange={e => setInputs({...inputs, name: e.target.value})} 
                    placeholder="Search by name..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 transition-all dark:text-white" 
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Department</label>
                <select 
                  value={inputs.department} 
                  onChange={e => handleDropdownChange('department', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 dark:text-white"
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electronics">Electronics</option>
                </select>
              </div>

              {/* Graduation Year */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Graduation Year</label>
                <select 
                  value={inputs.graduationYear} 
                  onChange={e => handleDropdownChange('graduationYear', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 dark:text-white"
                >
                  <option value="">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Company */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Company</label>
                <input 
                  value={inputs.company} 
                  onChange={e => setInputs({...inputs, company: e.target.value})} 
                  placeholder="e.g. Google, Microsoft" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 dark:text-white" 
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Location</label>
                <input 
                  value={inputs.location} 
                  onChange={e => setInputs({...inputs, location: e.target.value})} 
                  placeholder="e.g. Bangalore, Remote" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 dark:text-white" 
                />
              </div>

              {/* Skills */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Skills</label>
                <input 
                  value={inputs.skills} 
                  onChange={e => setInputs({...inputs, skills: e.target.value})} 
                  placeholder="e.g. React, Java, SQL" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 dark:text-white" 
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Alumni Grid */}
        <section className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Alumni Directory</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Discover and connect with GEC alumni globally</p>
            </div>
            <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
              <span className="text-sm font-bold text-primary">{pagination.total}</span>
              <span className="text-sm text-slate-500 ml-1.5">Alumni Found</span>
            </div>
          </div>

          {loading && alumni.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} type="profile" />)}
            </div>
          ) : alumni.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-20 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-slate-300">person_search</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No matching alumni found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try adjusting your filters or clearing them to see all results.</p>
              <button onClick={clearFilters} className="mt-6 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg transition-all">Clear All Filters</button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {alumni.map((a, i) => (
                <AlumniCard 
                  key={a.id} 
                  alumnus={a} 
                  gradientCls={gradients[i % gradients.length]} 
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button 
                disabled={page <= 1 || loading} 
                onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button 
                disabled={page >= pagination.totalPages || loading} 
                onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AlumniDirectoryPage;

