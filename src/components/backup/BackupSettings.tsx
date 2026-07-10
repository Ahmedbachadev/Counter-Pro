import React from 'react';
import { Save, Folder, Server, Lock, HardDrive, Bell } from 'lucide-react';
import { useBackupStore } from '../../stores/backupStore';

const BackupSettings: React.FC = () => {
  const { settings, updateSettings } = useBackupStore();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-blue-500" /> Automation & Scheduling
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Enable Automatic Backups</p>
              <p className="text-xs text-slate-500 mt-1">Run backups in the background without interrupting your work.</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors ${settings.autoBackupEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.autoBackupEnabled ? 'right-1' : 'left-1'}`}></div>
            </div>
          </label>
          
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Backup Frequency</p>
            <select 
              value={settings.frequency}
              onChange={(e) => updateSettings({ frequency: e.target.value as any })}
              disabled={!settings.autoBackupEnabled}
              className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            >
              <option value="hourly">Every Hour</option>
              <option value="daily">Daily (at midnight)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="on_exit">On Application Exit</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <HardDrive className="h-5 w-5 text-purple-500" /> Storage & Retention
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Retention Policy</p>
            <p className="text-xs text-slate-500 mb-3">Oldest backups will be deleted automatically to save space.</p>
            <select 
              value={settings.retentionPolicy}
              onChange={(e) => updateSettings({ retentionPolicy: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="keep_5">Keep Last 5 Backups</option>
              <option value="keep_10">Keep Last 10 Backups</option>
              <option value="keep_30">Keep Last 30 Backups</option>
              <option value="keep_all">Keep All (Not Recommended)</option>
            </select>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Storage Location</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={settings.defaultLocation}
                readOnly
                className="flex-1 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                <Folder className="h-4 w-4" /> Browse
              </button>
            </div>
          </div>
          
          <label className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Enable Compression</p>
              <p className="text-xs text-slate-500 mt-1">Compress backups to save disk space. May slightly increase backup time.</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors ${settings.compressionEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.compressionEnabled ? 'right-1' : 'left-1'}`}></div>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-emerald-500" /> Security & Notifications
        </h3>
        
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 mb-4 opacity-75 cursor-not-allowed relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Coming Soon</div>
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Encrypted Backups</p>
          <p className="text-xs text-slate-500">Secure your backups with military-grade AES-256 encryption and password protection.</p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Notify on Failure</p>
                <p className="text-xs text-slate-500 mt-1">Get alerted if a scheduled backup fails or is corrupted.</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors ${settings.notifyOnFailure ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.notifyOnFailure ? 'right-1' : 'left-1'}`}></div>
            </div>
          </label>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default BackupSettings;
