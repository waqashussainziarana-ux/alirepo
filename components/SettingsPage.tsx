
import React, { useRef } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { RefreshIcon } from './icons/RefreshIcon';

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

  return (
    <div className="space-y-6">
      {/* Cloud Status Card */}
      <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <RefreshIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            Cloud Storage
          </h2>
          <span className="bg-success/10 text-success text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
            Connected
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Your account <span className="font-bold text-slate-700">@{currentUser}</span> is currently synced with the global Vercel Database. Your data is accessible from any device.
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Account</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Logged in as</p>
            <p className="text-base font-bold text-slate-800">{currentUser}</p>
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
            <span className="text-xs">Backup JSON</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="text-xs">Restore JSON</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept="application/json" />
        </div>
        <p className="text-[10px] text-slate-400 mt-4 text-center">
          Use these options for manual local backups. Cloud sync is always active.
        </p>
      </div>
      
      <div className="text-center py-4">
        <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
          Daily Transactions v3.0
        </div>
        <div className="text-[9px] text-primary/40 font-bold uppercase mt-1">
          Secured by Vercel KV
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
