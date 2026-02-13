
import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { CubeIcon } from './icons/CubeIcon';
import { TagIcon } from './icons/TagIcon';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (name: string, price: number, unit: string) => void;
  onEditItem?: (item: Item) => void;
  itemToEdit?: Item | null;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem, onEditItem, itemToEdit }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');

  const isEditMode = !!itemToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setName(itemToEdit.name);
        setPrice(itemToEdit.price.toString());
        setUnit(itemToEdit.unit || '');
      } else {
        setName('');
        setPrice('');
        setUnit('');
      }
    }
  }, [isOpen, itemToEdit, isEditMode]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (name.trim() && !isNaN(numericPrice) && numericPrice >= 0) {
      if (isEditMode && onEditItem) {
        onEditItem({
          ...itemToEdit,
          name: name.trim(),
          price: numericPrice,
          unit: unit.trim(),
        });
      } else {
        onAddItem(name.trim(), numericPrice, unit.trim());
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-sm m-0 sm:m-4 flex flex-col transition-all transform animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {isEditMode ? 'Edit Item' : 'New Item Registration'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Fill in the details for your catalog
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="item-name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Product Name
            </label>
            <div className="relative">
               <CubeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary font-bold text-sm"
                placeholder="e.g. iPhone"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="item-price" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Base Price
              </label>
              <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">€</span>
                  <input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary font-bold text-sm"
                  placeholder="0.00"
                  required
                  />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="item-unit" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unit
              </label>
              <div className="relative">
                <TagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  id="item-unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary font-bold text-sm"
                  placeholder="e.g. Kg, Pcs"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              {isEditMode ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AddItemModal;
