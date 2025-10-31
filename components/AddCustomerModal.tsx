

import React, { useState } from 'react';
import { UserIcon } from './icons/UserIcon';
import { PhoneIcon } from './icons/PhoneIcon';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: (name: string, phone: string) => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onAddCustomer }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onAddCustomer(name.trim(), phone.trim());
      setName('');
      setPhone('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="customer-name" className="block text-sm font-medium text-slate-600 mb-1">
              Customer Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="customer-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Enter name"
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="customer-phone" className="block text-sm font-medium text-slate-600 mb-1">
              Phone Number
            </label>
            <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Enter phone number"
                required
                />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
