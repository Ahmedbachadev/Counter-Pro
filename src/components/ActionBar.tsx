import React from 'react';
import { Plus, Upload, Download, Printer, RefreshCw, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionBarProps {
  onAdd?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  onMore?: () => void;
  
  addLabel?: string;
  importLabel?: string;
  exportLabel?: string;
  printLabel?: string;
  refreshLabel?: string;
  moreLabel?: string;

  disabledAdd?: boolean;
  disabledImport?: boolean;
  disabledExport?: boolean;
  disabledPrint?: boolean;
  disabledRefresh?: boolean;
  disabledMore?: boolean;

  showAdd?: boolean;
  showImport?: boolean;
  showExport?: boolean;
  showPrint?: boolean;
  showRefresh?: boolean;
  showMore?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onAdd,
  onImport,
  onExport,
  onPrint,
  onRefresh,
  onMore,
  addLabel,
  importLabel,
  exportLabel,
  printLabel,
  refreshLabel,
  moreLabel,
  disabledAdd = false,
  disabledImport = false,
  disabledExport = false,
  disabledPrint = false,
  disabledRefresh = false,
  disabledMore = false,
  showAdd = true,
  showImport = true,
  showExport = true,
  showPrint = true,
  showRefresh = true,
  showMore = true,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        {showAdd && onAdd && (
          <button
            onClick={onAdd}
            disabled={disabledAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{addLabel || t('common.addNew', 'Add New')}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showImport && onImport && (
          <button
            onClick={onImport}
            disabled={disabledImport}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common.import', 'Import')}
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">{importLabel || t('common.import', 'Import')}</span>
          </button>
        )}

        {showExport && onExport && (
          <button
            onClick={onExport}
            disabled={disabledExport}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common.export', 'Export')}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">{exportLabel || t('common.export', 'Export')}</span>
          </button>
        )}

        {showPrint && onPrint && (
          <button
            onClick={onPrint}
            disabled={disabledPrint}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common.print', 'Print')}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">{printLabel || t('common.print', 'Print')}</span>
          </button>
        )}

        {showRefresh && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={disabledRefresh}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">{refreshLabel || t('common.refresh', 'Refresh')}</span>
          </button>
        )}

        {showMore && onMore && (
          <button
            onClick={onMore}
            disabled={disabledMore}
            className="flex items-center justify-center p-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title={moreLabel || t('common.more', 'More Actions')}
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionBar;
