import React from 'react';
import { useSyncStore } from '../../stores/syncStore';
import { CheckCircle2, AlertCircle, Info, CloudOff, X } from 'lucide-react';

const SyncToasts: React.FC = () => {
  const { toasts, removeToast } = useSyncStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClass = 'text-blue-500 bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          colorClass = 'text-emerald-500 bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          colorClass = 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50';
        } else if (toast.type === 'warning') {
          Icon = CloudOff;
          colorClass = 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl shadow-lg border w-72 sm:w-80 animate-slide-up ${colorClass} transition-all`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SyncToasts;
