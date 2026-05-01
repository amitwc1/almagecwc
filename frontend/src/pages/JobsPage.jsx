import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import jobService from '../services/jobService';
import { useAuth } from '../context/AuthContext';

const sampleJobs = [
  { id: 1, title: 'Senior Product Designer', company: 'Stellar AI', location: 'San Francisco, CA (Remote)', salary: '$140k – $190k', tag: 'Alumni Referral Available', tagStyle: 'bg-primary/5 text-primary' },
  { id: 2, title: 'Supply Chain Manager', company: 'Global Logistics Group', location: 'Chicago, IL', salary: '$95k – $130k', tag: 'Posted 2h ago', tagStyle: 'bg-slate-100 text-slate-500' },
  { id: 3, title: 'Full Stack Developer (Next.js)', company: 'EcoGrid Solutions', location: 'Austin, TX', salary: '$120k – $165k', tag: '5 Alumni Work Here', tagStyle: 'bg-primary/5 text-primary' },
  { id: 4, title: 'Clinical Operations Lead', company: 'HealthBridge Tech', location: 'Boston, MA', salary: '$110k – $145k', tag: 'Remote Optional', tagStyle: 'bg-slate-100 text-slate-500' },
];

const JobsPage = () => {
  const [jobs, setJobs] = useState(sampleJobs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', location: '', salary: '', description: '' });
  const { user, token } = useAuth();

  useEffect(() => {
    jobService.getAll().then(data => { if (data.length > 0) setJobs(data); }).catch(() => {});
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await jobService.create(form, token);
      const data = await jobService.getAll();
      setJobs(data);
      setShowForm(false);
      setForm({ title: '', company: '', location: '', salary: '', description: '' });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-[#f5f7f8] min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-6 md:px-20 py-8">
        <section className="mb-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Exclusive Alumni Opportunities</h1>
              <p className="text-slate-500">Showing {jobs.length} jobs curated for your network.</p>
            </div>
            {user && (user.role === 'alumni' || user.role === 'admin') && (
              <button onClick={() => setShowForm(!showForm)} className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90">
                <span className="material-symbols-outlined text-sm mr-1 align-middle">add</span> Post Job
              </button>
            )}
          </div>
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-primary/5">
            <div className="flex flex-1 items-center gap-2 px-4 border-r border-slate-200">
              <span className="material-symbols-outlined text-primary">search</span>
              <input className="w-full border-none bg-transparent focus:ring-0 focus:outline-none text-sm py-2" placeholder="Job title, keywords, or company" type="text" />
            </div>
            <div className="flex flex-1 items-center gap-2 px-4 border-r border-slate-200">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <input className="w-full border-none bg-transparent focus:ring-0 focus:outline-none text-sm py-2" placeholder="City, state, or remote" type="text" />
            </div>
            <button className="w-full md:w-auto px-8 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">Search Jobs</button>
          </div>
        </section>

        {/* Post Job Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl p-6 border border-primary/5 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Post a New Job</h3>
            <form onSubmit={handlePost} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Job Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:ring-primary/20" />
              <input placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} required
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:ring-primary/20" />
              <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:ring-primary/20" />
              <input placeholder="Salary Range" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:ring-primary/20" />
              <textarea placeholder="Job Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="md:col-span-2 px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:ring-primary/20 h-24" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm">Submit</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Job Listings */}
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white rounded-xl border border-primary/5 hover:border-primary/20 hover:shadow-md transition-all">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  <span className="material-symbols-outlined text-slate-400 text-2xl">domain</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="font-medium text-primary">{job.company}</span>
                    {job.location && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">location_on</span>{job.location}</span>}
                    {job.salary && <span className="font-semibold text-slate-900">{job.salary}</span>}
                  </div>
                  {job.tag && <div className="mt-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${job.tagStyle || 'bg-slate-100 text-slate-500'}`}>{job.tag}</span></div>}
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex items-center gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50">Save</button>
                <button className="flex-1 md:flex-none px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90">Apply Now</button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JobsPage;
