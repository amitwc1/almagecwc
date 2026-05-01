import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkeletonCard from '../components/SkeletonCard';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '', image_url: '' });
  const { user, token } = useAuth();

  useEffect(() => {
    eventService.getAll().then(data => {
      setEvents(data.data || data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await eventService.create(form, token);
      toast.success('Event created!');
      const data = await eventService.getAll();
      setEvents(data.data || data || []);
      setShowForm(false);
      setForm({ title: '', description: '', event_date: '', location: '', image_url: '' });
    } catch { toast.error('Failed to create event'); }
  };

  const handleRSVP = async (eventId) => {
    try {
      const result = await eventService.register(eventId, token);
      toast.success(`Registered! QR: ${result.qr_code?.slice(0, 20)}...`);
      const data = await eventService.getAll();
      setEvents(data.data || data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-[#f5f7f8] dark:bg-background-dark min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 md:px-10 lg:px-20 py-8 max-w-7xl mx-auto w-full">
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black leading-tight tracking-tight dark:text-white">Alumni Events</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">Discover opportunities to reconnect, learn, and grow with your global alumni network.</p>
          </div>
          {user && (user.role === 'alumni' || user.role === 'admin') && (
            <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shrink-0">
              <span className="material-symbols-outlined text-sm">add</span> Create Event
            </button>
          )}
        </section>

        {showForm && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border border-primary/5 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Create New Event</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm" />
              <input type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} required className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm" />
              <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm" />
              <input placeholder="Image URL" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="md:col-span-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm h-24" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />) :
            events.map((event) => (
              <div key={event.id} className="group flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-primary/5 dark:border-slate-700 hover:shadow-xl transition-all">
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{backgroundImage: event.image_url ? `url("${event.image_url}")` : 'none', backgroundColor: '#003366'}}></div>
                  {event.attendee_count > 0 && (
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded text-xs font-bold text-primary">
                      {event.attendee_count} attending
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-lg">event</span>
                    <span className="text-primary font-semibold text-sm">{formatDate(event.event_date)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-primary transition-colors">{event.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4 text-sm">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    <span>{event.location}</span>
                  </div>
                  {event.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{event.description}</p>}
                  <div className="mt-auto flex items-center justify-end gap-2">
                    {user && (
                      <button onClick={() => handleRSVP(event.id)} className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">how_to_reg</span> RSVP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventsPage;
