import React from 'react';

const Loader = ({ fullPage = true }) => {
  const containerClass = fullPage 
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
    : "flex flex-col items-center justify-center p-8 w-full h-full";

  return (
    <div className={containerClass} style={{ opacity: 1, visibility: 'visible' }}>
      <div className="flex flex-col items-center">
        {/* Simple Spinner */}
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <h2 className="mt-4 text-lg font-bold text-slate-800">GEC ALUMNI</h2>
        <p className="text-sm text-slate-500 font-medium">Loading System...</p>
      </div>
    </div>
  );
};

export default Loader;

