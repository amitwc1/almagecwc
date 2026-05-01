import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary dark:bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary">
                <span className="material-symbols-outlined text-2xl font-bold">school</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">GEC Alumni</span>
            </div>
            <p className="text-sm text-blue-100/70 leading-relaxed">
              Uniting graduates of Government Engineering College West Champaran worldwide. Empowering our community through connection and collaboration.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-blue-100/70">
              <li><Link className="hover:text-white transition-colors" to="/directory">Find Alumni</Link></li>
              <li><Link className="hover:text-white transition-colors" to="/events">Upcoming Events</Link></li>
              <li><Link className="hover:text-white transition-colors" to="/jobs">Job Board</Link></li>
              <li><Link className="hover:text-white transition-colors" to="/mentorship">Mentorship Program</Link></li>
              <li><Link className="hover:text-white transition-colors" to="/messages">Messages</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-blue-100/70">
              <li><a className="hover:text-white transition-colors" href="#">Campus Map</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Transcript Request</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Giving Back</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-blue-100/70">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-300">location_on</span>
                <span>GEC West Champaran,<br/>Bihar, India</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-300">call</span>
                <span>+91 XXXX XXXX XX</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-300">email</span>
                <span>alumni@gecwc.ac.in</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 text-center text-xs text-blue-100/40">
          <p>© {new Date().getFullYear()} Government Engineering College West Champaran Alumni Association. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
