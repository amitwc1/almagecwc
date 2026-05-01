import { Link } from 'react-router-dom';
import ConnectionButton from './ConnectionButton';

const AlumniCard = ({ alumnus, gradientCls }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm relative">
      {/* Header Background */}
      <div className={`h-28 bg-gradient-to-r ${gradientCls || 'from-slate-700 to-slate-500'} relative rounded-t-2xl`}>
        {/* Profile Image Wrap */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800 overflow-hidden shadow-inner relative group">
            {alumnus?.profile_image ? (
              <>
                {(() => {
                  const rawPath = alumnus.profile_image;
                  const baseUrl = import.meta.env.VITE_API_URL || '';
                  // Robust URL construction: avoid double slashes
                  const finalUrl = rawPath.startsWith('http') 
                    ? rawPath 
                    : `${baseUrl.replace(/\/$/, '')}/${rawPath.replace(/^\//, '')}`;
                  
                  console.log("Raw Image Path:", rawPath);
                  console.log("Final Image URL:", finalUrl);
                  
                  return (
                    <img 
                      src={finalUrl} 
                      alt={alumnus?.name || 'Alumnus'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        console.error("Image load failed for URL:", finalUrl);
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus?.name || 'A')}&background=random&color=fff&size=128`;
                      }}
                    />
                  );
                })()}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-black text-3xl bg-primary/10">
                {alumnus?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-16 p-6 flex flex-col items-center text-center flex-1">
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">
          {alumnus.name}
        </h3>
        <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">
          {alumnus.job_title || 'GEC Alumnus'}
        </p>
        {alumnus.roll_number && (
          <p className="text-[10px] font-bold text-slate-400 mb-3 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
            Roll No: {alumnus.roll_number}
          </p>
        )}
        
        <div className="space-y-1.5 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[18px] text-slate-400">corporate_fare</span>
            {alumnus.company || 'Not specified'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {alumnus.department && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">school</span>
                {alumnus.department}
              </p>
            )}
            {alumnus.graduation_year && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Class of {alumnus.graduation_year}
              </p>
            )}
          </div>
          {alumnus.location && (
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {alumnus.location}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto w-full pt-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between gap-2">
          <div className="flex-1">
            <ConnectionButton targetUserId={alumnus.id} size="sm" />
          </div>
          <div className="flex gap-2">
            <Link 
              to={`/profile/${alumnus.id}`} 
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-slate-100 dark:border-slate-700"
              title="View Profile"
            >
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </Link>
            <Link 
              to={`/messages`} 
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-slate-100 dark:border-slate-700"
              title="Message"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniCard;
