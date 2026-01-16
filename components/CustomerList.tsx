
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import DashboardSummary from './DashboardSummary';
import { calculateBalance, formatCurrency } from '../utils/helpers';
import AllTransactionsList from './AllTransactionsList';
import { PlusIcon } from './icons/PlusIcon';
import AddCustomerModal from './AddCustomerModal';
import { SearchIcon } from './icons/SearchIcon';
import { SortIcon } from './icons/SortIcon';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';


interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onAddCustomer: (name: string, phone: string) => void;
  onDeleteCustomer: (id: string) => void;
}

const CustomerListItem: React.FC<{ customer: Customer; onSelect: () => void; onDelete: (e: React.MouseEvent) => void }> = ({ customer, onSelect, onDelete }) => {
  const balance = calculateBalance(customer);

  const balanceColor = balance > 0 ? 'text-success' : balance < 0 ? 'text-danger' : 'text-slate-500';
  const balanceText = balance > 0 ? 'To get' : balance < 0 ? 'To give' : 'Settled';

  return (
    <li
      onClick={onSelect}
      className="flex justify-between items-center p-4 border-b border-slate-200 hover:bg-slate-50 cursor-pointer group"
    >
      <div className="flex-grow">
        <p className="font-semibold text-slate-800">{customer.name}</p>
        <p className="text-sm text-slate-500">{customer.phone}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`font-bold ${balanceColor}`}>{formatCurrency(Math.abs(balance))}</p>
          <p className={`text-xs ${balanceColor}`}>{balanceText}</p>
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-slate-300 hover:text-danger hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Delete Customer"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </li>
  );
};

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onAddCustomer, onDeleteCustomer }) => {
  const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [view, setView] = useState<'customers' | 'transactions'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('balance-desc');

  const sortedAndFilteredCustomers = useMemo(() => {
    let result = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'balance-asc': // Lowest balance (highest to give) first
          return calculateBalance(a) - calculateBalance(b);
        case 'balance-desc': // Highest balance (highest to get) first
        default:
          return calculateBalance(b) - calculateBalance(a);
      }
    });

    return result;
  }, [customers, searchTerm, sortOrder]);

  const handleDeleteRequest = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      onDeleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
            aria-label="Search Customers"
          />
        </div>
        <div className="relative">
          <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full md:w-auto pl-10 pr-8 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary appearance-none bg-white cursor-pointer"
            aria-label="Sort Customers"
          >
            <option value="balance-desc">Balance: High to Low</option>
            <option value="balance-asc">Balance: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
      </div>


      <DashboardSummary customers={customers} />
      
      <div className="mb-4 border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
              <button
                  onClick={() => setView('customers')}
                  className={`px-3 py-2 font-medium text-sm rounded-t-md ${view === 'customers' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Customers
              </button>
              <button
                  onClick={() => setView('transactions')}
                  className={`px-3 py-2 font-medium text-sm rounded-t-md ${view === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  All Transactions
              </button>
          </nav>
      </div>

      {view === 'customers' && (
        <>
          {customers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">No customers yet.</p>
              <p className="text-slate-400">Click the '+' button to add your first customer.</p>
            </div>
          ) : sortedAndFilteredCustomers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">No customers found.</p>
            </div>
          ) : (
            <ul className="bg-white rounded-lg shadow overflow-hidden">
              {sortedAndFilteredCustomers.map(customer => (
                <CustomerListItem 
                  key={customer.id} 
                  customer={customer} 
                  onSelect={() => onSelectCustomer(customer.id)}
                  onDelete={(e) => handleDeleteRequest(e, customer)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {view === 'transactions' && <AllTransactionsList customers={customers} onSelectCustomer={onSelectCustomer} />}

      <button
        onClick={() => setAddCustomerModalOpen(true)}
        className="fixed bottom-20 right-6 lg:right-[calc(50%-15rem)] bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform transform hover:scale-105"
        aria-label="Add New Customer"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setAddCustomerModalOpen(false)}
        onAddCustomer={onAddCustomer}
      />

      <ConfirmationModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={
          <>
            Are you sure you want to delete <strong>{customerToDelete?.name}</strong>? 
            All transaction history will be permanently removed.
          </>
        }
      />
    </div>
  );
};

export default CustomerList;
