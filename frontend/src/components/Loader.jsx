import React from 'react';

const Loader = ({ fullPage = true }) => {
  const containerClass = fullPage 
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-900"
    : "flex flex-col items-center justify-center p-8 w-full h-full";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        
        {/* Inner Ring (Reverse Spin) */}
        <div className="absolute w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-secondary rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
        
        {/* Center Dot */}
        <div className="absolute w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      </div>
      
      <div className="mt-6 flex flex-col items-center">
        <h2 className="text-xl font-black tracking-tighter text-slate-800 dark:text-white">
          GEC <span className="text-primary">ALUMNI</span>
        </h2>
        <div className="flex gap-1 mt-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
