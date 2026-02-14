
import React, { useState, useMemo } from 'react';
import { Customer, TransactionType } from '../types';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { SearchIcon } from './icons/SearchIcon';
import { SortIcon } from './icons/SortIcon';

interface AllTransactionsListProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
}

const AllTransactionsList: React.FC<AllTransactionsListProps> = ({ customers, onSelectCustomer }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const allTransactions = useMemo(() => customers
    .flatMap(customer =>
      customer.transactions.map(tx => ({
        ...tx,
        customerId: customer.id,
        customerName: customer.name,
      }))
    ), [customers]);

  const filteredTransactions = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allTransactions
      .filter(tx => {
        const searchMatch = !lowerSearchTerm ||
          tx.customerName.toLowerCase().includes(lowerSearchTerm) ||
          (tx.description && tx.description.toLowerCase().includes(lowerSearchTerm)) ||
          tx.items.some(item => item.name.toLowerCase().includes(lowerSearchTerm));
        if (!searchMatch) return false;

        // Date range filter using string comparison (YYYY-MM-DD)
        const txDateStr = tx.date.substring(0, 10);
        if (startDate && txDateStr < startDate) {
          return false;
        }
        if (endDate && txDateStr > endDate) {
          return false;
        }

        // Transaction type filter
        if (filterType !== 'ALL' && tx.type !== filterType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          case 'date-desc':
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [allTransactions, searchTerm, startDate, endDate, filterType, sortOrder]);

  if (allTransactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">No transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
            aria-label="Search Transactions"
          />
        </div>
        <div className="relative">
          <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full md:w-auto pl-10 pr-8 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary appearance-none bg-white cursor-pointer"
            aria-label="Sort Transactions"
          >
            <option value="date-desc">Date: Newest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg mb-4 space-y-3 border border-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start-date" className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2"
              aria-label="Start Date Filter"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2"
              aria-label="End Date Filter"
            />
          </div>
        </div>
        <div>
          <fieldset>
            <legend className="block text-xs font-medium text-slate-600 mb-2">Transaction Type</legend>
            <div className="flex items-center justify-around">
              <div className="flex items-center">
                <input
                  id="filter-all"
                  name="filter-type"
                  type="radio"
                  checked={filterType === 'ALL'}
                  onChange={() => setFilterType('ALL')}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="filter-all" className="ml-2 block text-sm text-slate-800">
                  All
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="filter-gave"
                  name="filter-type"
                  type="radio"
                  checked={filterType === TransactionType.GAVE}
                  onChange={() => setFilterType(TransactionType.GAVE)}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="filter-gave" className="ml-2 block text-sm font-medium text-danger">
                  You Gave
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="filter-got"
                  name="filter-type"
                  type="radio"
                  checked={filterType === TransactionType.GOT}
                  onChange={() => setFilterType(TransactionType.GOT)}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="filter-got" className="ml-2 block text-sm font-medium text-success">
                  You Got
                </label>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500">No transactions match your filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredTransactions.map(tx => (
            <li
              key={tx.id}
              className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-transform duration-150 ease-in-out hover:scale-[1.02] active:scale-[0.99]"
              onClick={() => onSelectCustomer(tx.customerId)}
            >
              <div>
                <p className="font-semibold text-slate-800">{tx.customerName}</p>
                <p className="text-sm text-slate-600">
                  {tx.items.length > 0 ? `${tx.items.length} item(s)` : tx.description || 'Transaction'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{formatDateTime(tx.date)}</p>
              </div>
              <p className={`font-bold text-lg ${tx.type === TransactionType.GAVE ? 'text-danger' : 'text-success'}`}>
                {tx.type === TransactionType.GAVE ? '-' : '+'} {formatCurrency(tx.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllTransactionsList;
