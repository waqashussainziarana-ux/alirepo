
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
  onEditTransaction?: (transaction: Transaction) => void;
  transactionToEdit?: Transaction | null;
  transactionType: TransactionType;
  allItems: Item[];
  onAddItem: (name: string, price: number, unit: string) => Item;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  transactionToEdit,
  transactionType,
  allItems,
  onAddItem,
}) => {
  const [mode, setMode] = useState<'items' | 'cash'>('items');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [cashAmount, setCashAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  const totalAmount = useMemo(() => {
    if (mode === 'cash') {
      return parseFloat(cashAmount) || 0;
    }
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems, cashAmount, mode]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setDescription(transactionToEdit.description || '');
        setDate(transactionToEdit.date.split('T')[0]);
        if (transactionToEdit.items && transactionToEdit.items.length > 0) {
          setMode('items');
          setSelectedItems(transactionToEdit.items);
          setCashAmount('');
        } else {
          setMode('cash');
          setCashAmount(transactionToEdit.amount.toString());
          setSelectedItems([]);
        }
      } else {
        setDescription('');
        setSelectedItems([]);
        setSelectedItemId('');
        setCashAmount('');
        setMode('items');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, transactionToEdit]);

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
    setIsAddItemModalOpen(false); 
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
      const txDate = new Date(date).toISOString();
      if (transactionToEdit && onEditTransaction) {
        onEditTransaction({
          ...transactionToEdit,
          amount: totalAmount,
          description: description.trim(),
          type: transactionType,
          items: mode === 'items' ? selectedItems : [],
          date: txDate,
        });
      } else {
        onAddTransaction({
          amount: totalAmount,
          description: description.trim(),
          type: transactionType,
          items: mode === 'items' ? selectedItems : [],
        } as any); 
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  const isGave = transactionType === TransactionType.GAVE;
  const isEdit = !!transactionToEdit;
  const title = isEdit ? `Edit ${isGave ? 'You Gave' : 'You Got'}` : (isGave ? 'You Gave' : 'You Got');
  const buttonColor = isGave ? 'bg-danger hover:bg-red-700' : 'bg-success hover:bg-green-700';

  return (
    <>
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[92vh] overflow-hidden flex flex-col transition-all transform animate-slide-up sm:animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-2 border-b border-slate-50">
          <h2 className="text-xl font-black text-slate-800">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          {/* Tabs */}
          {!isEdit && (
            <div className="px-5 pt-1">
              <nav className="flex space-x-5 border-b border-slate-100" aria-label="Tabs">
                <button
                  type="button"
                  onClick={() => setMode('items')}
                  className={`flex items-center gap-2 pb-2.5 pt-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${mode === 'items' ? 'text-primary' : 'text-slate-400'}`}
                >
                  <CubeIcon className="w-3.5 h-3.5"/> 
                  Items
                  {mode === 'items' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('cash')}
                  className={`flex items-center gap-2 pb-2.5 pt-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${mode === 'cash' ? 'text-primary' : 'text-slate-400'}`}
                >
                  <CashIcon className="w-3.5 h-3.5"/> 
                  Cash
                  {mode === 'cash' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
                </button>
              </nav>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto px-5 py-3 space-y-4">
            {/* Header Data: Grid-based layout to prevent collision/proportion issues */}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                <label htmlFor="tx-date" className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[11px] font-bold text-slate-700"
                  required
                />
              </div>
              <div className="col-span-7 pl-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Total Amount
                </label>
                <div className="text-base sm:text-xl font-black text-slate-800 pb-1.5 truncate leading-tight">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>

            {mode === 'items' ? (
              <div className="space-y-3">
                {!isEdit && (
                  <div>
                    <label htmlFor="items" className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Item
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        id="items"
                        value={selectedItemId}
                        onChange={(e) => handleItemSelection(e.target.value)}
                        className="flex-grow min-w-0 px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[11px] font-semibold appearance-none cursor-pointer"
                      >
                        <option value="">Choose item...</option>
                        <option value="--add-new--" className="font-bold text-primary">+ Create New Item</option>
                        {allItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({formatCurrency(item.price)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedItemId}
                        className="flex-shrink-0 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400 shadow-sm transition-all"
                      >
                        <PlusIcon className="w-4.5 h-4.5"/>
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedItems.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 border-t border-slate-50 pt-3">
                    {selectedItems.map(item => (
                      <div key={item.itemId} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg group">
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-800 text-[10px] truncate">{item.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {formatCurrency(item.price)} {item.unit ? `/ ${item.unit}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden">
                            <button 
                              type="button" 
                              onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                              className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-50 active:text-primary transition-colors font-bold text-xs"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value, 10) || 1)}
                              className="w-7 py-0.5 text-center text-[10px] font-black border-x border-slate-100 focus:outline-none bg-white"
                            />
                            <button 
                              type="button" 
                              onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                              className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-50 active:text-primary transition-colors font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                          {!isEdit && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(item.itemId)} 
                              className="text-slate-300 hover:text-danger p-0.5 transition-colors"
                            >
                              <PlusIcon className="w-3 h-3 rotate-45" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="cash-amount" className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">€</span>
                    <input
                      id="cash-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-black text-lg text-slate-800"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 50, 100].map(val => (
                    <button 
                      key={val} 
                      type="button" 
                      onClick={() => handleAddCash(val)} 
                      className="text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 py-1 px-2.5 rounded-full hover:bg-primary/5 hover:border-primary transition-all active:scale-95"
                    >
                      + €{val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="description" className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary text-[11px] font-semibold resize-none"
                placeholder="Write a small note..."
              />
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="flex-shrink-0 p-5 bg-slate-50/50 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-grow py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={totalAmount <= 0}
              className={`flex-[2] py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 ${buttonColor} disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400`}
            >
              {isEdit ? 'Update' : 'Save Entry'}
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

    <style>{`
      @keyframes slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @keyframes fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-slide-up {
        animation: slide-up 0.3s ease-out forwards;
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out forwards;
      }
    `}</style>
    </>
  );
};

export default AddTransactionModal;
