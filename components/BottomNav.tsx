import React from 'react';
import { UsersIcon } from './icons/UsersIcon';
import { CubeIcon } from './icons/CubeIcon';
import { CogIcon } from './icons/CogIcon';

type View = 'customers' | 'items' | 'settings';

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'text-primary';
  const inactiveClasses = 'text-slate-500 hover:text-primary';
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};


const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto h-16 bg-white border-t border-slate-200 shadow-t-lg z-20">
      <div className="flex justify-around items-stretch h-full">
        <NavItem
          label="Customers"
          icon={<UsersIcon className="w-6 h-6 mb-1" />}
          isActive={activeView === 'customers'}
          onClick={() => setActiveView('customers')}
        />
        <NavItem
          label="Items"
          icon={<CubeIcon className="w-6 h-6 mb-1" />}
          isActive={activeView === 'items'}
          onClick={() => setActiveView('items')}
        />
        <NavItem
          label="Settings"
          icon={<CogIcon className="w-6 h-6 mb-1" />}
          isActive={activeView === 'settings'}
          onClick={() => setActiveView('settings')}
        />
      </div>
    </div>
  );
};

export default BottomNav;
