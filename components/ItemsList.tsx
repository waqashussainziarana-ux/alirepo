
import React, { useState, useMemo } from 'react';
import { Item } from '../types';
import AddItemModal from './AddItemModal';
import { PlusIcon } from './icons/PlusIcon';
import { formatCurrency } from '../utils/helpers';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CubeIcon } from './icons/CubeIcon';
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

const ItemCard: React.FC<{ 
  item: Item; 
  onEdit: () => void; 
  onDelete: () => void 
}> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow truncate">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <CubeIcon className="w-6 h-6" />
          </div>
          <div className="truncate">
            <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{item.name}</h3>
            {item.unit && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                Unit: {item.unit}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-primary">
            {formatCurrency(item.price)}
          </p>
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
              title="Edit Item"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/5 rounded-md transition-colors"
              title="Delete Item"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemsList: React.FC<ItemsListProps> = ({ items, onAddItem, onEditItem, onDeleteItem, onAddMultipleItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // DEFENSIVE: Ensure items is an array before filtering
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
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

  const safeItemsCount = Array.isArray(items) ? items.length : 0;

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary text-xs font-bold shadow-sm"
          />
        </div>
        <button
          onClick={() => setIsBulkAddModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Bulk Add Items (CSV Style)
        </button>
      </div>

      {/* List Container */}
      <div className="space-y-3">
        {safeItemsCount === 0 ? (
          <div className="text-center py-20 px-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CubeIcon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Your Catalog is Empty</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-[200px] mx-auto leading-relaxed">
              Add your inventory items here to quickly record transactions later.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs font-bold text-slate-400 italic">No items found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-24">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onEdit={() => handleOpenEditModal(item)}
                onDelete={() => setItemToDelete(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-20 right-6 bg-primary text-white rounded-2xl p-4 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all z-20"
        aria-label="Add New Item"
      >
        <div className="flex items-center gap-2">
          <PlusIcon className="w-6 h-6" />
          <span className="text-xs font-black uppercase pr-2 hidden sm:inline">Add Item</span>
        </div>
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
        title="Delete Catalog Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This won't affect past transactions, but the item won't be available for new ones.`}
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
