import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string; // Tailwind class like "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
  trend?: {
    value: string | number;
    type: 'positive' | 'negative' | 'neutral';
  };
  comparisonText?: string;
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
  trend,
  comparisonText,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm h-36 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-24"></div>
            <div className="h-8 bg-slate-200 dark:bg-gray-800 rounded w-32"></div>
          </div>
          <div className="h-10 w-10 bg-slate-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
        <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 h-36 flex flex-col justify-between">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 tracking-tight block truncate uppercase">
            {title}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight truncate">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl shrink-0 ${iconColor}`}>
            <Icon className="w-5.5 h-5.5" />
          </div>
        )}
      </div>
      
      {(trend || comparisonText) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm mt-3 pt-2 border-t border-slate-50 dark:border-gray-850">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 font-semibold ${
              trend.type === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
              trend.type === 'negative' ? 'text-rose-600 dark:text-rose-400' :
              'text-slate-500 dark:text-gray-400'
            }`}>
              {trend.type === 'positive' && <ArrowUpRight className="w-4 h-4 shrink-0" />}
              {trend.type === 'negative' && <ArrowDownRight className="w-4 h-4 shrink-0" />}
              <span>{trend.value}</span>
            </span>
          )}
          {comparisonText && (
            <span className="text-slate-400 dark:text-gray-500 font-medium">
              {comparisonText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
