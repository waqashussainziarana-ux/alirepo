import React from 'react';
import { XIcon } from './icons/XIcon';

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-16 left-0 right-0 max-w-2xl mx-auto p-3 z-20">
      <div className="bg-primary-dark text-white rounded-lg shadow-lg p-3 flex items-center justify-between animate-fade-in-up">
        <div className="flex-grow">
          <p className="font-bold text-sm">Add to Home Screen</p>
          <p className="text-xs text-blue-200">For a faster, offline experience.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onInstall}
            className="bg-white text-primary font-bold py-1 px-4 rounded-md text-sm hover:bg-slate-100"
          >
            Install
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-primary-light"
            aria-label="Dismiss install banner"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default InstallBanner;
