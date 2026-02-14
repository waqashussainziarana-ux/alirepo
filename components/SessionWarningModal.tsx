
import React from 'react';

interface SessionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({ isOpen, onClose, onConfirm, count }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-amber-500 p-6 flex justify-center">
          <div className="bg-white/20 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
        </div>
        <div className="p-6 text-center">
          <h3 className="text-xl font-black text-slate-800 mb-2">Security Alert</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Another device is logged in but inactive (<span className="font-bold text-amber-600">{count} session(s)</span>).
          </p>
          <p className="text-[11px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
            To secure your data, you can log out idle devices.
          </p>
        </div>
        <div className="p-4 bg-slate-50 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95"
          >
            Logout Idle Devices
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
