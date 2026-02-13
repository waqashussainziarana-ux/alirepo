import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface HeaderProps {
  customerName?: string;
  onBack?: () => void;
  activeView?: 'customers' | 'items' | 'settings';
  showInstallButton: boolean;
  onInstallClick: () => void;
  // Fix: Added isSyncing and syncError to satisfy TypeScript as they are passed from App.tsx
  isSyncing: boolean;
  syncError: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  customerName, 
  onBack, 
  activeView, 
  showInstallButton, 
  onInstallClick,
  isSyncing,
  syncError 
}) => {
  const getTitle = () => {
    if (customerName) return customerName;
    if (activeView === 'items') return 'My Items';
    if (activeView === 'settings') return 'Settings';
    return 'Daily Transactions';
  }

  return (
    <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
      <div className="flex items-center flex-grow truncate">
        {onBack && (
          <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-primary-light flex-shrink-0" aria-label="Go back">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col truncate">
          <h1 className="text-xl font-bold truncate">
            {getTitle()}
          </h1>
          {/* Visual feedback for sync status in the header */}
          {isSyncing && (
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/70 animate-pulse">
              Syncing...
            </span>
          )}
          {syncError && !isSyncing && (
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-200">
              Sync Error
            </span>
          )}
        </div>
      </div>
      
      {showInstallButton && (
        <button onClick={onInstallClick} className="ml-4 p-2 rounded-full hover:bg-primary-light flex-shrink-0" aria-label="Install App">
          <DownloadIcon className="w-6 h-6" />
        </button>
      )}
    </header>
  );
};

export default Header;