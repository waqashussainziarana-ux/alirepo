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
  isInstallable: boolean;
  isInstalled: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onExport, onImport, onLogout, currentUser, onInstallClick, isInstallable, isInstalled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const renderInstallSection = () => {
    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isInstalled) {
      return (
        <div className="bg-green-100 border border-green-200 p-4 rounded-lg text-center">
            <p className="text-sm text-green-800 font-medium">Application is installed on this device.</p>
        </div>
      );
    }
    
    if (isIOS) {
        return (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-slate-700 mb-2 font-semibold">To install on your iPhone or iPad:</p>
                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                    <li>Tap the <span className="font-bold">Share</span> button in Safari.</li>
                    <li>Scroll down and tap <span className="font-bold">'Add to Home Screen'</span>.</li>
                </ol>
            </div>
        );
    }

    return (
      <>
        <p className="text-sm text-slate-500 mb-4">
          Install the app on your device for a better experience, including offline access and faster loading.
        </p>
        <button
          onClick={onInstallClick}
          disabled={!isInstallable}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-100 text-primary font-bold rounded-lg hover:bg-blue-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
          aria-label="Install App"
        >
          <DownloadIcon className="w-6 h-6" />
          <span>Install App</span>
        </button>
        {!isInstallable && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            Installation becomes available after you use the app for a bit. If the button remains disabled, your browser may not support PWA installation.
          </p>
        )}
      </>
    );
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
      
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Application</h2>
        {renderInstallSection()}
      </div>

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