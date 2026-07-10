import React, { useState } from 'react';
import { AlertTriangle, Clock, ArrowDown, ArrowRight, Check, X, ShieldAlert, GitMerge } from 'lucide-react';
import { mockConflicts } from './mockData';
import { SyncConflict } from './syncTypes';

const SyncConflicts: React.FC = () => {
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [mergedData, setMergedData] = useState<Record<string, any>>({});

  const handleSelectConflict = (conflict: SyncConflict) => {
    setSelectedConflict(conflict);
    setMergedData({}); // Reset merge selection
  };

  const handleFieldSelect = (key: string, value: any) => {
    setMergedData(prev => ({ ...prev, [key]: value }));
  };

  const renderConflictViewer = () => {
    if (!selectedConflict) return null;

    const cloudKeys = Object.keys(selectedConflict.cloud_version);
    const localKeys = Object.keys(selectedConflict.local_version);
    const allKeys = Array.from(new Set([...cloudKeys, ...localKeys]));

    return (
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="bg-slate-50 dark:bg-gray-800/50 p-4 border-b border-slate-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-blue-500" />
              Conflict Resolution Viewer
            </h4>
            <p className="text-xs text-slate-500 mt-1">Select fields to keep, or choose a bulk action below.</p>
          </div>
          <button onClick={() => setSelectedConflict(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-1/4">Field</th>
                <th className="py-3 px-4 w-1/4">
                  <div className="flex flex-col">
                    <span className="text-blue-600 dark:text-blue-400">Cloud Version</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">By: {selectedConflict.modified_by}</span>
                  </div>
                </th>
                <th className="py-3 px-4 w-1/4 text-center">
                  <ArrowRight className="h-4 w-4 mx-auto text-slate-300" />
                </th>
                <th className="py-3 px-4 w-1/4">
                  <div className="flex flex-col">
                    <span className="text-emerald-600 dark:text-emerald-400">Local Version</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">Current Device</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
              {allKeys.map(key => {
                const cloudVal = selectedConflict.cloud_version[key];
                const localVal = selectedConflict.local_version[key];
                const isDifferent = JSON.stringify(cloudVal) !== JSON.stringify(localVal);
                const isSelectedCloud = mergedData[key] === cloudVal && mergedData[key] !== undefined;
                const isSelectedLocal = mergedData[key] === localVal && mergedData[key] !== undefined;

                return (
                  <tr key={key} className={isDifferent ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {key}
                      {isDifferent && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-500" title="Different values" />}
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => isDifferent && handleFieldSelect(key, cloudVal)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                          isSelectedCloud ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
                          isDifferent ? 'border-slate-200 dark:border-gray-700 hover:border-blue-300' : 'border-transparent'
                        }`}
                      >
                        {cloudVal !== undefined ? JSON.stringify(cloudVal).replace(/"/g, '') : <span className="text-slate-400 italic">null</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {isDifferent ? 'vs' : '='}
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => isDifferent && handleFieldSelect(key, localVal)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                          isSelectedLocal ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 
                          isDifferent ? 'border-slate-200 dark:border-gray-700 hover:border-emerald-300' : 'border-transparent'
                        }`}
                      >
                        {localVal !== undefined ? JSON.stringify(localVal).replace(/"/g, '') : <span className="text-slate-400 italic">null</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 dark:bg-gray-800/50 p-4 border-t border-slate-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-4">
          <button className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-gray-300 transition-colors">
            Review Later
          </button>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-colors">
              Keep Local (Overwrite Cloud)
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
              Keep Cloud (Discard Local)
            </button>
            <button 
              disabled={Object.keys(mergedData).length === 0}
              className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="h-4 w-4" /> Save Merged Version
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Conflict Center
            {mockConflicts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold">
                {mockConflicts.length} Unresolved
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Resolve data conflicts between your local device and the cloud.
          </p>
        </div>
      </div>

      {!selectedConflict && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Conflict Type</th>
                  <th className="py-3 px-4">Modified By</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-gray-800">
                {mockConflicts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-base font-medium text-slate-600 dark:text-slate-300">No conflicts found</p>
                      <p className="text-xs mt-1">Your data is perfectly synchronized.</p>
                    </td>
                  </tr>
                ) : (
                  mockConflicts.map((conflict) => (
                    <tr key={conflict.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {conflict.record_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-200">
                        {conflict.table_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-[10px] font-bold uppercase flex items-center w-max gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {conflict.conflict_type.replace('_', ' vs ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {conflict.modified_by}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(conflict.modified_time).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => handleSelectConflict(conflict)}
                          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {renderConflictViewer()}
    </div>
  );
};

export default SyncConflicts;
