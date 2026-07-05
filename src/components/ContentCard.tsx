import React from 'react';

interface ContentCardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      
      {/* Card Header (Optional) */}
      {(title || subtitle || actions) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-gray-900/50">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className={noPadding ? '' : 'p-5 sm:p-6'}>
        {children}
      </div>

    </div>
  );
};

export default ContentCard;
