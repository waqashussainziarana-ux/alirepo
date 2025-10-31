import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Item, TransactionItem } from '../types';
import { formatCurrency } from '../utils/helpers';
import { PlusIcon } from './icons/PlusIcon';
import { CubeIcon } from './icons/CubeIcon';
import { CashIcon } from './icons/CashIcon';
import AddItemModal from './AddItemModal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  transactionType: TransactionType;
  allItems: Item[];
  onAddItem: (name: string, price: number, unit: string) => Item;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  transactionType,
  allItems,
  onAddItem,
}) => {
  const [mode, setMode] = useState<'items' | 'cash'>('items');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [cashAmount, setCashAmount] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  const totalAmount = useMemo(() => {
    if (mode === 'cash') {
      return parseFloat(cashAmount) || 0;
    }
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems, cashAmount, mode]);

  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setSelectedItems([]);
      setSelectedItemId('');
      setCashAmount('');
      setMode('items');
    }
  }, [isOpen]);

  const handleItemSelection = (itemId: string) => {
    if (itemId === '--add-new--') {
      setIsAddItemModalOpen(true);
      setSelectedItemId('');
    } else {
      setSelectedItemId(itemId);
    }
  };

  const handleSaveNewItem = (name: string, price: number, unit: string) => {
    const newItem = onAddItem(name, price, unit);
    setIsAddItemModalOpen(false); // Close the item modal
    
    // Automatically add the new item to the transaction
    if (newItem) {
        setSelectedItems(prev => [
            ...prev,
            { itemId: newItem.id, name: newItem.name, price: newItem.price, quantity: 1, unit: newItem.unit }
        ]);
    }
  };


  const handleAddItem = () => {
    const itemToAdd = allItems.find(i => i.id === selectedItemId);
    if (!itemToAdd) return;
    
    const existingItemIndex = selectedItems.findIndex(i => i.itemId === itemToAdd.id);

    if (existingItemIndex > -1) {
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          itemId: itemToAdd.id,
          name: itemToAdd.name,
          price: itemToAdd.price,
          quantity: 1,
          unit: itemToAdd.unit,
        },
      ]);
    }
    setSelectedItemId('');
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setSelectedItems(
      selectedItems.map(item =>
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };
  
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
  };
  
  const handleAddCash = (amountToAdd: number) => {
    const currentAmount = parseFloat(cashAmount) || 0;
    setCashAmount((currentAmount + amountToAdd).toFixed(2));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount > 0) {
      onAddTransaction({
        amount: totalAmount,
        description: description.trim(),
        type: transactionType,
        items: mode === 'items' ? selectedItems : [],
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const isGave = transactionType === TransactionType.GAVE;
  const title = isGave ? 'You Gave' : 'You Got';
  const buttonColor = isGave ? 'bg-danger hover:bg-red-700' : 'bg-success hover:bg-green-700';

  return (
    <>
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">{title}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col h-[60vh]">
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setMode('items')}
                className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-md ${mode === 'items' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CubeIcon className="w-5 h-5"/> Items
              </button>
              <button
                type="button"
                onClick={() => setMode('cash')}
                className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-md ${mode === 'cash' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CashIcon className="w-5 h-5"/> Cash
              </button>
            </nav>
          </div>

          <div className="flex-grow overflow-y-auto pr-2">
            {mode === 'items' ? (
              <>
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">
                    Total Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                    <input
                      id="amount"
                      type="text"
                      value={totalAmount.toFixed(2)}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md bg-slate-100 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="items" className="block text-sm font-medium text-slate-600 mb-1">
                    Add Items
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="items"
                      value={selectedItemId}
                      onChange={(e) => handleItemSelection(e.target.value)}
                      className="flex-grow px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select an item</option>
                      <option value="--add-new--" className="font-bold text-primary bg-blue-50">-- Add New Item --</option>
                      {allItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({formatCurrency(item.price)}
                          {item.unit ? ` / ${item.unit}` : ''})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedItemId}
                      className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-slate-300"
                    >
                      <PlusIcon className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {selectedItems.map(item => (
                    <div key={item.itemId} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(item.price)}{' '}
                          {item.unit ? `/ ${item.unit}` : 'each'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value, 10))}
                          className="w-16 p-1 border border-slate-300 rounded-md text-center"
                        />
                        <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700 text-xs font-bold px-1">
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label htmlFor="cash-amount" className="block text-sm font-medium text-slate-600 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                    <input
                      id="cash-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button type="button" onClick={() => handleAddCash(5)} className="text-sm bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-full hover:bg-slate-300">+ €5</button>
                  <button type="button" onClick={() => handleAddCash(10)} className="text-sm bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-full hover:bg-slate-300">+ €10</button>
                  <button type="button" onClick={() => handleAddCash(20)} className="text-sm bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-full hover:bg-slate-300">+ €20</button>
                  <button type="button" onClick={() => handleAddCash(50)} className="text-sm bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-full hover:bg-slate-300">+ €50</button>
                </div>
              </>
            )}

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">
                Description (Optional)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="e.g., for goods, salary"
              />
            </div>
          </div>
          
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={totalAmount <= 0}
              className={`px-4 py-2 text-white rounded-md ${buttonColor} disabled:bg-slate-400`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItem={handleSaveNewItem}
      />
    </>
  );
};

export default AddTransactionModal;
