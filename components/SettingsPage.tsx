import React, { useRef } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface SettingsPageProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  currentUser: string;
  onInstallClick: () => void;
  showInstallButton: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onExport, onImport, onLogout, currentUser, onInstallClick, showInstallButton }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Account</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
          <p className="text-slate-600">
            Logged in as <span className="font-bold text-slate-800">{currentUser}</span>
          </p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-danger font-bold text-sm rounded-lg hover:bg-red-200 transition-colors"
          >
            <LogoutIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {showInstallButton && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Application</h2>
          <p className="text-sm text-slate-500 mb-4">
            Install the app on your device for a better experience, including offline access and faster loading.
          </p>
          <button
            onClick={onInstallClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-100 text-primary font-bold rounded-lg hover:bg-blue-200 transition-colors"
          >
            <DownloadIcon className="w-6 h-6" />
            <span>Install App</span>
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Data Management</h2>
        <p className="text-sm text-slate-500 mb-4">
          Export your data for backup, or import a file to restore your data. Importing will overwrite any existing data in the app.
        </p>
        <div className="space-y-4">
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-100 text-primary font-bold rounded-lg hover:bg-blue-200 transition-colors"
          >
            <DownloadIcon className="w-6 h-6" />
            <span>Export Data</span>
          </button>
          <button
            onClick={handleImportClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-100 text-success font-bold rounded-lg hover:bg-green-200 transition-colors"
          >
            <UploadIcon className="w-6 h-6" />
            <span>Import Data</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImport}
            className="hidden"
            accept="application/json"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
