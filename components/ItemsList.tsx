import React, { useState, useMemo } from 'react';
import { Item } from '../types';
import AddItemModal from './AddItemModal';
import { PlusIcon } from './icons/PlusIcon';
import { formatCurrency } from '../utils/helpers';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import BulkAddItemModal from './BulkAddItemModal';
import { SearchIcon } from './icons/SearchIcon';

interface ItemsListProps {
  items: Item[];
  onAddItem: (name: string, price: number, unit: string) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onAddMultipleItems: (items: Array<Omit<Item, 'id'>>) => void;
}

const ItemsList: React.FC<ItemsListProps> = ({ items, onAddItem, onEditItem, onDeleteItem, onAddMultipleItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Item) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div>
       <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
              aria-label="Search Items"
            />
          </div>
          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            className="text-sm bg-blue-100 text-primary font-semibold py-2 px-4 rounded-md hover:bg-blue-200 transition-colors flex-shrink-0"
            aria-label="Add multiple items at once"
          >
            + Add Multiple
          </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500">No items in your catalog yet.</p>
          <p className="text-slate-400">Click the '+' button to add your first item.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500">No items found.</p>
        </div>
      ) : (
        <ul className="bg-white rounded-lg shadow overflow-hidden">
          {filteredItems.map(item => (
            <li key={item.id} className="flex justify-between items-center p-4 border-b border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(item.price)}
                  {item.unit && <span> / {item.unit}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenEditModal(item)}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full"
                  aria-label={`Edit ${item.name}`}
                >
                    <PencilIcon className="w-5 h-5"/>
                </button>
                <button
                  onClick={() => setItemToDelete(item)}
                  className="p-2 text-slate-500 hover:text-danger hover:bg-red-100 rounded-full"
                  aria-label={`Delete ${item.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-20 right-6 lg:right-[calc(50%-15rem)] bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform transform hover:scale-105"
        aria-label="Add New Item"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddItem={onAddItem}
        onEditItem={onEditItem}
        itemToEdit={itemToEdit}
      />
      
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />

      <BulkAddItemModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onAddMultipleItems={onAddMultipleItems}
      />
    </div>
  );
};

export default ItemsList;
