
import React, { useState, useMemo } from 'react';
import { Customer, TransactionType, Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { SearchIcon } from './icons/SearchIcon';
import { SortIcon } from './icons/SortIcon';

interface AllTransactionsListProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
}

interface ExtendedTransaction extends Transaction {
  customerId: string;
  customerName: string;
}

const AllTransactionsList: React.FC<AllTransactionsListProps> = ({ customers, onSelectCustomer }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const allTransactions = useMemo(() => {
    const list: ExtendedTransaction[] = [];
    customers.forEach(customer => {
      customer.transactions.forEach(tx => {
        list.push({
          ...tx,
          customerId: customer.id,
          customerName: customer.name,
        });
      });
    });
    return list;
  }, [customers]);

  const filteredTransactions = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allTransactions
      .filter(tx => {
        const searchMatch = !lowerSearchTerm ||
          tx.customerName.toLowerCase().includes(lowerSearchTerm) ||
          (tx.description && tx.description.toLowerCase().includes(lowerSearchTerm)) ||
          tx.items?.some(item => item.name.toLowerCase().includes(lowerSearchTerm));
        
        if (!searchMatch) return false;

        const txDateStr = tx.date.substring(0, 10);
        if (startDate && txDateStr < startDate) return false;
        if (endDate && txDateStr > endDate) return false;

        if (filterType !== 'ALL' && tx.type !== filterType) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'amount-desc': return b.amount - a.amount;
          case 'amount-asc': return a.amount - b.amount;
          case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
          default: return 0;
        }
      });
  }, [allTransactions, searchTerm, startDate, endDate, filterType, sortOrder]);

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const date = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${date} • ${time}`;
  };

  if (allTransactions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
        <p className="text-slate-400 font-bold italic">No transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer or items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary text-xs"
          />
        </div>
        <div className="relative">
          <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg appearance-none text-xs cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-md text-[10px] font-bold"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-md text-[10px] font-bold"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {['ALL', TransactionType.GAVE, TransactionType.GOT].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${
                filterType === type 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type === 'ALL' ? 'Everything' : type === TransactionType.GAVE ? 'Gave' : 'Got'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-xs italic">No matching transactions found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {filteredTransactions.map(tx => (
              <li 
                key={tx.id} 
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onSelectCustomer(tx.customerId)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm group-hover:text-primary transition-colors">
                      {tx.customerName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {tx.items && tx.items.length > 0 
                        ? tx.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
                        : tx.description || 'General Entry'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${tx.type === TransactionType.GAVE ? 'text-danger' : 'text-success'}`}>
                      {tx.type === TransactionType.GAVE ? '-' : '+'} {formatCurrency(tx.amount)}
                    </p>
                    <p className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                      tx.type === TransactionType.GAVE ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'
                    }`}>
                      {tx.type}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                  {formatDateTime(tx.date)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="text-center py-4">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Showing {filteredTransactions.length} of {allTransactions.length} entries
        </p>
      </div>
    </div>
  );
};

export default AllTransactionsList;
