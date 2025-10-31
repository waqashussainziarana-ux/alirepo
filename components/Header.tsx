import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface HeaderProps {
  customerName?: string;
  onBack?: () => void;
  activeView?: 'customers' | 'items' | 'settings';
  showInstallButton: boolean;
  onInstallClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ customerName, onBack, activeView, showInstallButton, onInstallClick }) => {
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
        <h1 className="text-xl font-bold truncate">
          {getTitle()}
        </h1>
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
