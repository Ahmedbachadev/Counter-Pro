import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'danger';
  title?: string;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ActionItem[];
  children?: React.ReactNode; // For extra custom items
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  icon: Icon,
  actions = [],
  children
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 pb-5 border-b border-slate-200 dark:border-gray-800">
      
      {/* Breadcrumbs Section */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-gray-500 font-medium">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 mx-0.5 shrink-0" />}
                {crumb.onClick && !isLast ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-slate-600 dark:hover:text-slate-350 transition-colors duration-150"
                  >
                    {crumb.label}
                  </button>
                ) : crumb.href && !isLast ? (
                  <a
                    href={crumb.href}
                    className="hover:text-slate-600 dark:hover:text-slate-350 transition-colors duration-150"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className={isLast ? "text-slate-600 dark:text-slate-400 font-semibold" : ""}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Row: Icon/Title/Subtitle & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title and Subtitle Block */}
        <div className="flex items-start space-x-3.5">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-900/50">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions Area */}
        <div className="flex flex-wrap items-center gap-2.5">
          {children}
          
          {actions.map((act, idx) => {
            const ActIcon = act.icon;
            const isPrimary = act.variant === 'primary' || !act.variant;
            const isDanger = act.variant === 'danger';
            
            let btnClass = "btn-secondary py-2 text-xs sm:text-sm font-semibold px-3 sm:px-4 rounded-lg";
            if (isPrimary) {
              btnClass = "btn-primary py-2 text-xs sm:text-sm font-semibold px-3 sm:px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm";
            } else if (isDanger) {
              btnClass = "btn-danger py-2 text-xs sm:text-sm font-semibold px-3 sm:px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm";
            } else {
              // Secondary
              btnClass = "py-2 text-xs sm:text-sm font-semibold px-3 sm:px-4 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150";
            }

            return (
              <button
                key={idx}
                onClick={act.onClick}
                title={act.title}
                disabled={act.disabled}
                className={`${btnClass} flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {ActIcon && <ActIcon className="h-4 w-4 shrink-0" />}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default PageHeader;
