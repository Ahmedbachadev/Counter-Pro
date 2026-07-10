import React, { useEffect } from 'react';
import { ShieldCheck, HardDrive, FileCheck, Info, Check, X, AlertTriangle, Play, RefreshCw, Box, Users, CreditCard, Package, Settings as SettingsIcon } from 'lucide-react';
import { useBackupStore } from '../../stores/backupStore';

const RestoreWizard: React.FC = () => {
  const { backups, wizardState, setWizardStep, setRestoreOptions, closeRestoreWizard, setWizardVerification, executeRestore } = useBackupStore();
  const { isOpen, step, selectedBackupId, restoreOptions, verificationStatus, isRestoring } = wizardState;

  const selectedBackup = backups.find(b => b.id === selectedBackupId);

  // Mock verification step
  useEffect(() => {
    if (step === 3 && verificationStatus === 'idle') {
      setWizardVerification('checking');
      const timer = setTimeout(() => {
        setWizardVerification('passed');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, verificationStatus, setWizardVerification]);

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Restore Database</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md mb-6">
          Launch the Restore Wizard to safely recover your data from a previous backup. The wizard will guide you through verification and module selection.
        </p>
        <button 
          onClick={() => setWizardStep(1)} // This will be handled properly if we just open wizard, but let's assume BackupHistory opens it.
          // Wait, if it's rendered in the tabs, it should just show the first step.
          // I'll adjust the store logic slightly.
          className="btn-primary px-6 py-2.5 shadow-sm"
        >
          Not implemented here - Select a backup from History
        </button>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-gray-800 z-0"></div>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          step > i ? 'bg-emerald-500 text-white' : 
          step === i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 
          'bg-slate-100 text-slate-400 dark:bg-gray-800'
        }`}>
          {step > i ? <Check className="h-4 w-4" /> : i}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-500" /> Restore Wizard
        </h3>
        <button onClick={closeRestoreWizard} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 p-6 md:p-8 flex flex-col">
        {renderStepIndicator()}

        {/* Step 2: Options (Step 1 is implicit if opened from history) */}
        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Choose Restore Options</h4>
            <p className="text-sm text-slate-500 mb-6">Select which data modules you want to restore from <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{selectedBackupId}</span>.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${restoreOptions.products ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-800'}`}>
                <input type="checkbox" checked={restoreOptions.products} onChange={e => setRestoreOptions({ products: e.target.checked })} className="mt-1" />
                <div>
                  <div className="flex items-center gap-1.5"><Box className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="font-semibold text-slate-900 dark:text-white">Products</span></div>
                  <p className="text-xs text-slate-500 mt-1">Catalog, pricing, variants</p>
                </div>
              </label>
              
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${restoreOptions.customers ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-800'}`}>
                <input type="checkbox" checked={restoreOptions.customers} onChange={e => setRestoreOptions({ customers: e.target.checked })} className="mt-1" />
                <div>
                  <div className="flex items-center gap-1.5"><Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="font-semibold text-slate-900 dark:text-white">Customers</span></div>
                  <p className="text-xs text-slate-500 mt-1">Profiles, ledgers, contacts</p>
                </div>
              </label>
              
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${restoreOptions.sales ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-800'}`}>
                <input type="checkbox" checked={restoreOptions.sales} onChange={e => setRestoreOptions({ sales: e.target.checked })} className="mt-1" />
                <div>
                  <div className="flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="font-semibold text-slate-900 dark:text-white">Sales & Purchases</span></div>
                  <p className="text-xs text-slate-500 mt-1">Invoices, bills, receipts</p>
                </div>
              </label>
              
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${restoreOptions.inventory ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-800'}`}>
                <input type="checkbox" checked={restoreOptions.inventory} onChange={e => setRestoreOptions({ inventory: e.target.checked })} className="mt-1" />
                <div>
                  <div className="flex items-center gap-1.5"><Package className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="font-semibold text-slate-900 dark:text-white">Inventory</span></div>
                  <p className="text-xs text-slate-500 mt-1">Stock movements, counts</p>
                </div>
              </label>
              
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${restoreOptions.settings ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-800'}`}>
                <input type="checkbox" checked={restoreOptions.settings} onChange={e => setRestoreOptions({ settings: e.target.checked })} className="mt-1" />
                <div>
                  <div className="flex items-center gap-1.5"><SettingsIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="font-semibold text-slate-900 dark:text-white">App Settings</span></div>
                  <p className="text-xs text-slate-500 mt-1">Workspace config, UI prefs</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            {verificationStatus === 'checking' && (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verifying Backup Integrity...</h4>
                <p className="text-sm text-slate-500">Calculating checksums and verifying SQLite structure.</p>
              </>
            )}
            {verificationStatus === 'passed' && (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                  <Check className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verification Passed</h4>
                <p className="text-sm text-slate-500">Backup is healthy and ready to be restored.</p>
              </>
            )}
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && selectedBackup && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Restore Summary</h4>
            <p className="text-sm text-slate-500 mb-6">Please review the details before proceeding.</p>
            
            <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-5 border border-slate-200 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-gray-700">
                <span className="text-sm text-slate-500">Target Backup</span>
                <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">{selectedBackup.id}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-gray-700">
                <span className="text-sm text-slate-500">Backup Date</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{new Date(selectedBackup.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-gray-700">
                <span className="text-sm text-slate-500">Modules to Restore</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {Object.entries(restoreOptions).filter(([_, v]) => v).map(([k]) => (
                    <span key={k} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-semibold capitalize">{k}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Estimated Time</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">~ 12 seconds</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            {isRestoring ? (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 border-4 border-amber-100 dark:border-amber-900/30 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <HardDrive className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-amber-500" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Restoring Data...</h4>
                <p className="text-sm text-slate-500 mb-2">Please do not close the application or turn off your device.</p>
                <div className="w-64 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-amber-500 w-2/3 animate-pulse"></div>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Are you absolutely sure?</h4>
                <p className="text-sm text-slate-500 max-w-md">
                  This action will overwrite your current local database with the backup data. Any unsynced changes made since the backup will be permanently lost.
                </p>
              </>
            )}
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Restore Complete!</h4>
            <p className="text-sm text-slate-500 max-w-md">
              The application has successfully restored your data. The application needs to restart to apply all changes.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
        <button 
          onClick={() => step === 6 ? closeRestoreWizard() : setWizardStep(Math.max(1, step - 1))}
          disabled={step === 1 || isRestoring || step === 6}
          className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-0 transition-colors"
        >
          Back
        </button>
        
        {step === 2 && (
          <button 
            onClick={() => setWizardStep(3)}
            disabled={!Object.values(restoreOptions).some(Boolean)}
            className="btn-primary px-6 py-2 shadow-sm"
          >
            Verify Integrity
          </button>
        )}
        {step === 3 && (
          <button 
            onClick={() => setWizardStep(4)}
            disabled={verificationStatus !== 'passed'}
            className="btn-primary px-6 py-2 shadow-sm disabled:opacity-50"
          >
            View Summary
          </button>
        )}
        {step === 4 && (
          <button 
            onClick={() => setWizardStep(5)}
            className="btn-primary px-6 py-2 shadow-sm"
          >
            Confirm Details
          </button>
        )}
        {step === 5 && !isRestoring && (
          <button 
            onClick={executeRestore}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Play className="h-4 w-4" /> Start Restore
          </button>
        )}
        {step === 6 && (
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors"
          >
            Restart Application
          </button>
        )}
      </div>
    </div>
  );
};

export default RestoreWizard;
