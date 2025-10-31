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
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">{isEditMode ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="item-name" className="block text-sm font-medium text-slate-600 mb-1">
              Item Name
            </label>
            <div className="relative">
               <CubeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Enter item name"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="item-unit" className="block text-sm font-medium text-slate-600 mb-1">
              Unit (Optional)
            </label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="item-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="e.g., kg, pcs, litre"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="item-price" className="block text-sm font-medium text-slate-600 mb-1">
              Price
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="0.00"
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
              {isEditMode ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
