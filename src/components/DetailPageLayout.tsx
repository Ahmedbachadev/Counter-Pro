import React from 'react';
import { ArrowLeft, Clock, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DetailPageLayoutProps {
  onBack: () => void;
  title: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  actions?: React.ReactNode;
  
  // Left Column
  summaryHeader?: React.ReactNode; // e.g. Avatar + Name + Basic Stats
  infoSections: {
    title: string;
    icon?: any;
    items: { label: string; value: React.ReactNode; className?: string }[];
  }[];
  relatedRecords?: {
    title: string;
    count?: number;
    actions?: React.ReactNode;
    content: React.ReactNode;
  };
  
  // Right Column
  timeline?: {
    title: string;
    events: {
      id: string | number;
      title: string;
      description?: string;
      date: string;
      icon?: any;
      iconColor?: string;
    }[];
  };
  sidebarContent?: React.ReactNode;
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  onBack,
  title,
  subtitle,
  statusBadge,
  actions,
  summaryHeader,
  infoSections,
  relatedRecords,
  timeline,
  sidebarContent,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Detail View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition-colors duration-150"
            title={t('common.back', 'Back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {statusBadge}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {/* Main Grid: Left (Main Info) and Right (Timeline/Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Header block */}
          {summaryHeader && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
              {summaryHeader}
            </div>
          )}

          {/* Information Sections */}
          {infoSections.map((sec, idx) => {
            const SecIcon = sec.icon || Info;
            return (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-850 bg-slate-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                  <SecIcon className="w-4.5 h-4.5 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    {sec.title}
                  </h3>
                </div>
                <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                  {sec.items.map((item, itemIdx) => (
                    <div key={itemIdx} className={`space-y-1.5 ${item.className || ''}`}>
                      <span className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">
                        {item.label}
                      </span>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Related Records Section */}
          {relatedRecords && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-850 bg-slate-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    {relatedRecords.title}
                  </h3>
                  {relatedRecords.count !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400">
                      {relatedRecords.count}
                    </span>
                  )}
                </div>
                {relatedRecords.actions && (
                  <div className="flex items-center gap-2 shrink-0">
                    {relatedRecords.actions}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                {relatedRecords.content}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          
          {/* Sidebar Custom Content */}
          {sidebarContent}

          {/* Activity Timeline */}
          {timeline && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-850 bg-slate-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {timeline.title}
                </h3>
              </div>
              
              <div className="p-5 sm:p-6">
                {timeline.events.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-gray-500 text-center py-4">
                    {t('common.noTimelineEvents', 'No recent activities recorded')}
                  </p>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {timeline.events.map((event, eventIdx) => {
                        const EventIcon = event.icon || CheckCircle2;
                        const iconColorClass = event.iconColor || 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-slate-400';
                        
                        return (
                          <li key={event.id}>
                            <div className="relative pb-8">
                              {eventIdx !== timeline.events.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-gray-800" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${iconColorClass}`}>
                                    <EventIcon className="w-4.5 h-4.5" />
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5">
                                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {event.title}
                                  </p>
                                  {event.description && (
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                      {event.description}
                                    </p>
                                  )}
                                  <div className="text-xxs sm:text-xs text-slate-400 dark:text-gray-500 mt-1 font-medium">
                                    {event.date}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default DetailPageLayout;
