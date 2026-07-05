import React from 'react';
import { LucideIcon, HelpCircle, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  action,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-350 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm ${className}`}>
      <div className="p-3.5 rounded-full bg-slate-50 dark:bg-gray-850 text-slate-400 dark:text-gray-500 mb-4 ring-8 ring-slate-50/50 dark:ring-gray-850/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed font-medium">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 mt-5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
