import React from 'react';

// KPI Skeleton Loader
export const KpiSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm h-36 flex flex-col justify-between animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-24"></div>
        <div className="h-8 bg-slate-250 dark:bg-gray-750 rounded w-32"></div>
      </div>
      <div className="h-10 w-10 bg-slate-200 dark:bg-gray-800 rounded-xl"></div>
    </div>
    <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-48"></div>
  </div>
);

// Loading Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4 animate-pulse">
    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-gray-850">
      <div className="h-5 bg-slate-200 dark:bg-gray-800 rounded w-40"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-16"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-2/3"></div>
    </div>
  </div>
);

// Table Skeleton Loader
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
    <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-850 flex items-center justify-between">
      <div className="h-5 bg-slate-200 dark:bg-gray-800 rounded w-36"></div>
      <div className="h-8 bg-slate-200 dark:bg-gray-800 rounded w-24"></div>
    </div>
    <div className="p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 dark:border-gray-850 bg-slate-50/50 dark:bg-gray-900/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4">
                <div className="h-4 bg-slate-200 dark:bg-gray-850 rounded w-16"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-slate-100 dark:border-gray-850">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-4">
                  <div className="h-4 bg-slate-150 dark:bg-gray-800 rounded w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Detail Page Skeleton Loader
export const DetailSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Detail View Header Skeleton */}
    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 h-9 w-9 bg-slate-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 dark:bg-gray-800 rounded w-48"></div>
          <div className="h-4 bg-slate-150 dark:bg-gray-800 rounded w-32"></div>
        </div>
      </div>
      <div className="h-9 bg-slate-200 dark:bg-gray-800 rounded-lg w-28"></div>
    </div>

    {/* Detail Columns Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-8 bg-slate-250 dark:bg-gray-750 rounded w-1/2"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-850">
            <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-1/3"></div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-150 dark:bg-gray-800 rounded w-16"></div>
                <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-6 w-6 bg-slate-200 dark:bg-gray-800 rounded-full shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-gray-800 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-150 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
