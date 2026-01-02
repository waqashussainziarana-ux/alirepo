
import React, { useRef, useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { LogoutIcon } from './icons/LogoutIcon';

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
  const [kvUrl, setKvUrl] = useState(localStorage.getItem('vercel-kv-url') || '');
  const [kvToken, setKvToken] = useState(localStorage.getItem('vercel-kv-token') || '');

  const saveCloudConfig = () => {
    localStorage.setItem('vercel-kv-url', kvUrl);
    localStorage.setItem('vercel-kv-token', kvToken);
    alert("Vercel Database Config Saved! The app will refresh to apply changes.");
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          Vercel Cloud Database
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Connect to your Vercel KV database to sync transactions across all your devices. 
          Get these from your Vercel Storage Dashboard.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">KV REST API URL</label>
            <input 
              type="text" 
              value={kvUrl}
              onChange={e => setKvUrl(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-primary"
              placeholder="https://...upstash.io"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">KV REST API TOKEN</label>
            <input 
              type="password" 
              value={kvToken}
              onChange={e => setKvToken(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-primary"
              placeholder="Your Secret Token"
            />
          </div>
          <button
            onClick={saveCloudConfig}
            className="w-full mt-2 py-3 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-black transition-colors"
          >
            Connect Database
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Account</h2>
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Logged in as <span className="font-bold text-slate-800">{currentUser}</span>
          </p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-danger font-bold text-sm rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Manual Backup</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExport}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 text-primary font-bold rounded-lg hover:bg-blue-100 transition-colors"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="text-xs">Export JSON</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 text-success font-bold rounded-lg hover:bg-green-100 transition-colors"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="text-xs">Import JSON</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept="application/json" />
        </div>
      </div>
      
      <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest py-4">
        Daily Transactions v3.0 • Vercel Cloud Integrated
      </div>
    </div>
  );
};

export default SettingsPage;
