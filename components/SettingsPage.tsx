
import React, { useRef } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { isVercelEnabled } from '../services/vercelDb';

interface SettingsPageProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  currentUser: string;
  onInstallClick: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isSyncing?: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onExport, onImport, onLogout, currentUser, isSyncing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudActive = isVercelEnabled();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Account</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Logged in as</p>
            <p className="text-base font-bold text-slate-800">{currentUser}</p>
            <div className="mt-1 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${cloudActive ? 'bg-success' : 'bg-slate-300'}`}></div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                 {cloudActive ? 'Cloud Synchronized' : 'Local Storage Mode'}
               </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-danger font-bold text-sm rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Data Management</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExport}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="text-xs">Backup to File</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="text-xs">Restore from File</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept="application/json" />
        </div>
        <p className="mt-4 text-[11px] text-slate-400 text-center italic">
          {cloudActive 
            ? "Your data is automatically synced to the cloud. Use backups for extra safety." 
            : "Data is currently stored only on this device. Connect a cloud database to sync."}
        </p>
      </div>
      
      <div className="text-center py-4">
        <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
          Daily Transactions v4.0
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
