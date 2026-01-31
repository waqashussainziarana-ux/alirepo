
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import DashboardSummary from './DashboardSummary';
import { calculateBalance, calculateCustomerTotals, formatCurrency } from '../utils/helpers';
import AllTransactionsList from './AllTransactionsList';
import { PlusIcon } from './icons/PlusIcon';
import AddCustomerModal from './AddCustomerModal';
import EditCustomerModal from './EditCustomerModal';
import { SearchIcon } from './icons/SearchIcon';
import { SortIcon } from './icons/SortIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import ConfirmationModal from './ConfirmationModal';


interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onAddCustomer: (name: string, phone: string) => void;
  onEditCustomer: (id: string, name: string, phone: string) => void;
  onDeleteCustomer: (id: string) => void;
}

const CustomerListItem: React.FC<{ 
  customer: Customer; 
  onSelect: () => void; 
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void 
}> = ({ customer, onSelect, onEdit, onDelete }) => {
  const balance = calculateBalance(customer);
  const { totalGave, totalGot } = calculateCustomerTotals(customer);

  const balanceColor = balance < 0 ? 'text-danger' : balance > 0 ? 'text-success' : 'text-slate-400';
  const balanceText = balance < 0 ? 'To get' : balance > 0 ? 'To give' : 'Settled';

  return (
    <li
      onClick={onSelect}
      className="flex justify-between items-center p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer group transition-colors"
    >
      <div className="flex-grow truncate pr-2">
        <p className="font-bold text-slate-800 truncate text-sm">{customer.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[9px] text-slate-400 font-medium">{customer.phone}</p>
          <span className="text-[8px] text-slate-200">|</span>
          <p className="text-[9px] font-bold">
            <span className="text-success">Paid: {formatCurrency(totalGot)}</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-danger">Pending: {formatCurrency(totalGave)}</span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-right flex flex-col items-end">
          <p className={`font-black text-sm ${balanceColor}`}>{formatCurrency(Math.abs(balance))}</p>
          <p className={`text-[9px] font-bold uppercase tracking-tighter ${balanceColor}`}>{balanceText}</p>
        </div>
        
        {/* Tiny Actions Group */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-300 hover:text-primary hover:bg-blue-50 rounded-md"
            title="Edit"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-300 hover:text-danger hover:bg-red-50 rounded-md"
            title="Delete"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
};

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onAddCustomer, onEditCustomer, onDeleteCustomer }) => {
  const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [view, setView] = useState<'customers' | 'transactions'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('activity-desc');

  const sortedAndFilteredCustomers = useMemo(() => {
    let result = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'activity-desc': {
          const lastTxA = a.transactions.length > 0 
            ? Math.max(...a.transactions.map(t => new Date(t.date).getTime())) 
            : 0;
          const lastTxB = b.transactions.length > 0 
            ? Math.max(...b.transactions.map(t => new Date(t.date).getTime())) 
            : 0;
          return lastTxB - lastTxA;
        }
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'balance-asc': 
          return calculateBalance(a) - calculateBalance(b);
        case 'balance-desc': 
          return calculateBalance(b) - calculateBalance(a);
        default:
          return 0;
      }
    });

    return result;
  }, [customers, searchTerm, sortOrder]);

  const handleEditRequest = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setCustomerToEdit(customer);
  };

  const handleDeleteRequest = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-xs"
          />
        </div>
        <div className="relative">
          <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg appearance-none text-xs cursor-pointer"
          >
            <option value="activity-desc">Recent Activity</option>
            <option value="balance-desc">High Balance</option>
            <option value="balance-asc">Low Balance</option>
            <option value="name-asc">Name A-Z</option>
          </select>
        </div>
      </div>

      <DashboardSummary customers={customers} />
      
      <div className="flex gap-2 mb-4">
        <button
            onClick={() => setView('customers')}
            className={`flex-grow py-2 text-xs font-black rounded-lg transition-all ${view === 'customers' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
            CUSTOMERS
        </button>
        <button
            onClick={() => setView('transactions')}
            className={`flex-grow py-2 text-xs font-black rounded-lg transition-all ${view === 'transactions' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
            RECENT ACTIVITY
        </button>
      </div>

      {view === 'customers' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {sortedAndFilteredCustomers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-slate-400 text-xs italic">No matching customers found.</p>
            </div>
          ) : (
            <ul>
              {sortedAndFilteredCustomers.map(customer => (
                <CustomerListItem 
                  key={customer.id} 
                  customer={customer} 
                  onSelect={() => onSelectCustomer(customer.id)}
                  onEdit={(e) => handleEditRequest(e, customer)}
                  onDelete={(e) => handleDeleteRequest(e, customer)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {view === 'transactions' && <AllTransactionsList customers={customers} onSelectCustomer={onSelectCustomer} />}

      <button
        onClick={() => setAddCustomerModalOpen(true)}
        className="fixed bottom-20 right-6 bg-primary text-white rounded-full p-4 shadow-xl hover:scale-110 active:scale-95 transition-all z-20"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      <AddCustomerModal isOpen={isAddCustomerModalOpen} onClose={() => setAddCustomerModalOpen(false)} onAddCustomer={onAddCustomer} />
      <EditCustomerModal isOpen={!!customerToEdit} customer={customerToEdit} onClose={() => setCustomerToEdit(null)} onEditCustomer={(n, p) => onEditCustomer(customerToEdit!.id, n, p)} />
      <ConfirmationModal isOpen={!!customerToDelete} onClose={() => setCustomerToDelete(null)} onConfirm={() => { onDeleteCustomer(customerToDelete!.id); setCustomerToDelete(null); }} title="Delete Customer" message="Permanently delete this customer and all their transaction history?" />
    </div>
  );
};

export default CustomerList;
