import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="bg-[#f5f7f8] text-slate-900">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] w-full overflow-hidden">
          <div className="absolute inset-0 bg-primary/40 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent z-20"></div>
          <div className="absolute inset-0 z-0 bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGpjNje_Ctr60zAQUEjXjbwMjjXFavFQYPyWmP0VQlpln53pa1aOQjtNtuvQ7P7UT8k9wjnt-o0Te8Ypl8wAYsH5JMB8VFK1ry26wQ6hMJFOcIQlIiIYDXheNr2KDyXNsn_5JBZcAPv31VcdHG-x6_--kf2QFfx_xDtneZW5ZyvZzdINmYIe_O6lMN0O-YeY_eeaNW2CEKTPlJuLO1ljsLUT5bBuK55D2ZXB7zJ78OQk5YOYf-s0jcCopoFSfC7rwl43x7el892pQ")'}}></div>
          <div className="relative z-30 mx-auto flex h-full max-w-7xl flex-col justify-center px-6">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-5xl font-extrabold leading-tight text-white lg:text-6xl">
                Legacy of <span className="text-blue-300">Excellence</span>, Community of Leaders.
              </h1>
              <p className="text-lg text-slate-100/90 leading-relaxed">
                The official alumni network of Government Engineering College West Champaran. Reconnect with peers, mentor the next generation, and access exclusive career opportunities.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/register" className="rounded-lg bg-white px-8 py-3 text-base font-bold text-primary hover:bg-slate-100 transition-all shadow-lg">
                  Join the Network
                </Link>
                <Link to="/directory" className="rounded-lg bg-primary/30 border border-white/30 px-8 py-3 text-base font-bold text-white backdrop-blur-sm hover:bg-primary/40 transition-all">
                  Explore Directory
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: 'groups', value: '15,000+', label: 'Total Alumni', trend: '+5% this year' },
                { icon: 'psychology', value: '450+', label: 'Active Mentors', trend: '+12% growth' },
                { icon: 'work', value: '120+', label: 'Jobs Posted', trend: '8 new today' },
                { icon: 'event', value: '12', label: 'Upcoming Events', trend: 'View Calendar' },
              ].map((stat, i) => (
                <div key={i} className="group flex flex-col items-center rounded-xl border border-primary/10 bg-[#f5f7f8] p-8 text-center transition-all hover:shadow-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                  <p className="mt-2 font-medium text-slate-500">{stat.label}</p>
                  <span className="mt-2 text-xs font-bold text-green-600">{stat.trend}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Updates Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between pb-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Latest Community Updates</h2>
                <p className="mt-2 text-slate-500">Stay connected with recent news and milestones from our global alumni network.</p>
              </div>
              <Link to="/events" className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary">
                View All News <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { tag: 'Global Meet', title: 'Annual Alumni Meet 2024', desc: 'Join us for a weekend of nostalgia and networking this December at the main campus.', meta: 'Dec 15, 2024', metaIcon: 'calendar_today', btn: 'Register Now', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaJyDRBIBH7OiR2nujDX32X5y-WJhqKC9iE0MFr71L7arSFLzWBLsQW255HUFpXOcmlkFk9yu3PVMiTPnpQJUF508EEb_yVEjDN0PaUdsbrLcrZFMShRiitlW565WEZMVplpfT5yQPe2MvRtXhpc5i2hrrnLAHBXznPa_S18AOPa7N9k1ZSmxVWvo8xXgBY8_REg-6cVwTR5L-OE49cAxIbMuZjz685fX1qDb_o1wvnBzocbjSWaBsvWbfXn-LfCfJI2lUcputDXk' },
                { tag: 'Campus News', title: 'New AI Research Lab Opening', desc: 'GEC inaugurates a state-of-the-art AI lab funded by the Class of 1995 foundation.', meta: 'Main Campus', metaIcon: 'location_on', btn: 'Read More', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj3sxIOXJtu1GGA3he3eaa-E3Q6wWW4bMsrsg4lmLVpA84VLFsDIWJTquiFfpT8iSABu9FzJzeYUc947lJhPP3zcYR37_fX2rLCNpoyPMtwHMJ25hoJvWZkX0on-CIZdKvyhEtBKhLFLBxhpvCfgwx6ptCdXeyreVPluTimErRprt3OQS3NPHgOwsP_jqvs7nC4x-JuIkZ5Odw7PvHAyW5r5ag3rdS3iUsJ4xguoT6gUaSHBs_XdQum4JlECNnFJMoF6JBLMm8rdc' },
                { tag: 'Development', title: 'Global Webinar Series', desc: 'Learn from industry veterans about the future of Sustainable Engineering in our monthly series.', meta: 'Virtual Event', metaIcon: 'laptop_mac', btn: 'Save Seat', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxf4H21LriUW_VytZaBTPY3QSFk_qQLpyauw0v7kUgag_2qoSvt4Iqh_VTbXCiyb21-O4gA_RNKiFQWzqLexYJFXm4wdgMuuix0synMbiR3GccJgJC0II9IXvizIWOtKnFHzXU7TFUJsyl3yO1nDbksul7NJ1gl8UR6oPFBDcICtfQEHt0zZvKF_J1vZ10agu8il5L42bQmz3KEivhqDFPn_VldQVYUmjwMpqG4lYUgikhg4DwzOH4OchfbrdmR_z6jDhYj1zrTr0' },
              ].map((item, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-48 w-full bg-cover bg-center" style={{backgroundImage: `url("${item.img}")`}}></div>
                  <div className="p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.tag}</span>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <span className="material-symbols-outlined text-sm">{item.metaIcon}</span> {item.meta}
                      </span>
                      <button className="text-sm font-bold text-primary">{item.btn}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Donations Section */}
        <section className="py-20 bg-primary/5">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Support Your Alma Mater</h2>
              <p className="mt-4 max-w-2xl mx-auto text-slate-600">
                Your contributions help us provide scholarships, upgrade campus facilities, and support groundbreaking research. Every gift makes a difference.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { icon: 'school', title: 'Student Scholarships', desc: 'Empower the next generation of engineers by providing financial aid and excellence awards to deserving students.', btn: 'Contribute Now' },
                { icon: 'domain', title: 'Campus Development', desc: 'Help us build world-class laboratories, modernize classrooms, and enhance infrastructure for a better learning environment.', btn: 'Support Facilities' },
                { icon: 'biotech', title: 'Research & Innovation', desc: 'Support pioneering research projects and innovation hubs that solve real-world problems through engineering excellence.', btn: 'Fund Research' },
              ].map((card, i) => (
                <div key={i} className="flex flex-col items-center p-8 rounded-2xl bg-white shadow-sm border border-primary/5 transition-all hover:shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                  <p className="text-center text-sm text-slate-500 mb-8">{card.desc}</p>
                  <button className="mt-auto w-full py-3 px-6 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-sm">
                    {card.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
