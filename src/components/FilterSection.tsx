import React, { useState } from 'react';
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSectionProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Date Filter
  showDateFilter?: boolean;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;

  // Status Filter
  showStatusFilter?: boolean;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];

  // Category Filter
  showCategoryFilter?: boolean;
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;
  categoryOptions?: FilterOption[];

  // Reset Actions
  onReset: () => void;
  
  // Custom Filters Node (optional additional items)
  children?: React.ReactNode;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  showDateFilter = false,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  showStatusFilter = false,
  statusValue = '',
  onStatusChange,
  statusOptions = [],
  showCategoryFilter = false,
  categoryValue = '',
  onCategoryChange,
  categoryOptions = [],
  onReset,
  children
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Check if any filter is active
  const hasActiveFilters = 
    (showDateFilter && (startDate || endDate)) ||
    (showStatusFilter && statusValue) ||
    (showCategoryFilter && categoryValue) ||
    searchValue;

  const activeFiltersCount = [
    showDateFilter && (startDate || endDate) ? 1 : 0,
    showStatusFilter && statusValue ? 1 : 0,
    showCategoryFilter && categoryValue ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const showExpandButton = showDateFilter || showStatusFilter || showCategoryFilter || children;

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-4 transition-all duration-200">
      
      {/* Top Bar: Always Visible Search and Filter Toggle */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || t('common.searchPlaceholder', 'Search...')}
            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {showExpandButton && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-gray-700 transition-colors duration-150 ${
                isOpen 
                  ? 'bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white' 
                  : 'bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-850 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{t('common.filters', 'Filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5">
                  {activeFiltersCount}
                </span>
              )}
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors duration-150"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.reset', 'Reset')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panels */}
      {showExpandButton && isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-gray-850 animate-fadeIn">
          
          {/* Date Picker Range */}
          {showDateFilter && (
            <div className="space-y-1.5 col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">{t('common.startDate', 'Start Date')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">{t('common.endDate', 'End Date')}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Status Dropdown */}
          {showStatusFilter && onStatusChange && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">{t('common.status', 'Status')}</label>
              <select
                value={statusValue}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-855 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">{t('common.allStatus', 'All Statuses')}</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Dropdown */}
          {showCategoryFilter && onCategoryChange && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">{t('common.category', 'Category')}</label>
              <select
                value={categoryValue}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-855 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">{t('common.allCategories', 'All Categories')}</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Additional Custom Filters */}
          {children}

        </div>
      )}

      {/* Active Filter Indicators */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-slate-500 dark:text-gray-400 font-medium">{t('common.activeFilters', 'Active Filters')}:</span>
          {showDateFilter && (startDate || endDate) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900">
              {t('common.dateRange', 'Date')}: {startDate || '*'} - {endDate || '*'}
            </span>
          )}
          {showStatusFilter && statusValue && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900">
              {t('common.status', 'Status')}: {statusOptions.find(o => o.value === statusValue)?.label || statusValue}
            </span>
          )}
          {showCategoryFilter && categoryValue && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900">
              {t('common.category', 'Category')}: {categoryOptions.find(o => o.value === categoryValue)?.label || categoryValue}
            </span>
          )}
        </div>
      )}

    </div>
  );
};

export default FilterSection;
