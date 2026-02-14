
import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface HeaderProps {
  customerName?: string;
  onBack?: () => void;
  activeView?: 'customers' | 'items' | 'settings';
  showInstallButton: boolean;
  onInstallClick: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  customerName, 
  onBack, 
  activeView, 
  showInstallButton, 
  onInstallClick,
  onRefresh,
  isSyncing
}) => {
  const getTitle = () => {
    if (customerName) return customerName;
    if (activeView === 'items') return 'My Items';
    if (activeView === 'settings') return 'Settings';
    return 'Daily Transactions';
  }

  return (
    <header className="bg-primary text-white p-4 pt-[env(safe-area-inset-top,1rem)] shadow-md sticky top-0 z-10 flex items-center justify-between touch-none">
      <div className="flex items-center flex-grow truncate">
        {onBack && (
          <button 
            onClick={onBack} 
            className="mr-4 p-2 rounded-full hover:bg-primary-light active:bg-primary-dark transition-colors flex-shrink-0" 
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl font-bold truncate">
          {getTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => {
            e.preventDefault();
            onRefresh();
          }} 
          disabled={isSyncing}
          className={`p-3 -mr-2 rounded-full hover:bg-primary-light active:bg-primary-dark transition-all cursor-pointer flex-shrink-0 ${isSyncing ? 'opacity-50' : 'opacity-100'}`} 
          style={{ touchAction: 'manipulation' }}
          aria-label="Refresh Data"
        >
          <ArrowPathIcon className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {showInstallButton && (
          <button onClick={onInstallClick} className="p-2 rounded-full hover:bg-primary-light flex-shrink-0" aria-label="Install App">
            <DownloadIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
