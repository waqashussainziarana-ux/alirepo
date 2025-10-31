import React, { useState } from 'react';
import { Customer, Transaction, TransactionType, Item } from '../types';
import AddTransactionModal from './AddTransactionModal';
import { calculateBalance, formatCurrency } from '../utils/helpers';

interface CustomerDetailProps {
  customer: Customer;
  onAddTransaction: (customerId: string, transaction: Omit<Transaction, 'id' | 'date'>) => void;
  allItems: Item[];
  onAddItem: (name: string, price: number, unit: string) => Item;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onAddTransaction, allItems, onAddItem }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.GAVE);

  const balance = calculateBalance(customer);

  const handleOpenModal = (type: TransactionType) => {
    setTransactionType(type);
    setModalOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Net Balance</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(Math.abs(balance))}
            </p>
          </div>
          <div className={`text-sm font-semibold px-3 py-1 rounded-full ${balance >= 0 ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>
            {balance >= 0 ? 'You will get' : 'You will give'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {customer.transactions.length > 0 ? customer.transactions.map(tx => (
          <div key={tx.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-start">
            <div className="flex-grow">
               {tx.items && tx.items.length > 0 ? (
                 <div className="space-y-1">
                    {tx.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} <span className="text-slate-500">x{item.quantity} {item.unit || ''}</span></span>
                        <span className="text-slate-600">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                 </div>
               ) : (
                <p className="text-slate-800 font-medium">{tx.description || 'Transaction'}</p>
               )}
              <p className="text-xs text-slate-400 mt-1">{formatDate(tx.date)}</p>
            </div>
            <p className={`font-bold text-right pl-4 ${tx.type === TransactionType.GAVE ? 'text-danger' : 'text-success'}`}>
              {tx.type === TransactionType.GAVE ? '-' : '+'} {formatCurrency(tx.amount)}
            </p>
          </div>
        )) : (
            <div className="text-center py-10 text-slate-500">
                No transactions yet.
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto p-4 bg-white border-t border-slate-200 grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleOpenModal(TransactionType.GAVE)}
          className="bg-danger hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          You Gave
        </button>
        <button 
          onClick={() => handleOpenModal(TransactionType.GOT)}
          className="bg-success hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          You Got
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        transactionType={transactionType}
        onAddTransaction={(transaction) => onAddTransaction(customer.id, transaction)}
        allItems={allItems}
        onAddItem={onAddItem}
      />
    </div>
  );
};

export default CustomerDetail;
