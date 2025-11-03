import React from 'react';
import { RefreshIcon } from './icons/RefreshIcon';

interface UpdateNotificationProps {
  show: boolean;
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ show, onUpdate }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 max-w-2xl mx-auto p-3 z-30">
      <div className="bg-slate-800 text-white rounded-lg shadow-lg p-3 flex items-center justify-between animate-fade-in-up">
        <div className="flex-grow">
          <p className="font-bold text-sm">A new version is available!</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUpdate}
            className="bg-primary text-white font-bold py-1 px-4 rounded-md text-sm hover:bg-primary-dark flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
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

export default UpdateNotification;
