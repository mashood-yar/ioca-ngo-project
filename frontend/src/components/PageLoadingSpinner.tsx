import React from 'react';

export const PageLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Inner ring spinner */}
        <div className="absolute w-8 h-8 border-2 border-brand-teal/20 rounded-full"></div>
        <div className="absolute w-8 h-8 border-2 border-transparent border-t-brand-teal border-r-brand-teal rounded-full animate-spin"></div>
      </div>
      <span className="text-xs font-bold text-brand-navy/40 tracking-wider uppercase">Loading...</span>
    </div>
  );
};

export default PageLoadingSpinner;
