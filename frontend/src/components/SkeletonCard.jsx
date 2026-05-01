const SkeletonCard = ({ type = 'card' }) => {
  if (type === 'profile') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-700"></div>
        <div className="p-6 pt-12">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
          <div className="flex gap-2 mt-4">
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1"></div>
            <div className="h-9 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'job') {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
      </div>
    );
  }

  // Default card
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-700"></div>
      <div className="p-6">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-3"></div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-4"></div>
        <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
