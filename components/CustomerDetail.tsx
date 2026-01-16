
import React, { useState } from 'react';
import { Customer, Transaction, TransactionType, Item } from '../types';
import AddTransactionModal from './AddTransactionModal';
import { calculateBalance, formatCurrency } from '../utils/helpers';
import { PencilIcon } from './icons/PencilIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface CustomerDetailProps {
  customer: Customer;
  onAddTransaction: (customerId: string, transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onEditTransaction: (customerId: string, transaction: Transaction) => void;
  onDeleteTransaction: (customerId: string, transactionId: string) => void;
  allItems: Item[];
  onAddItem: (name: string, price: number, unit: string) => Item;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ 
  customer, 
  onAddTransaction, 
  onEditTransaction,
  onDeleteTransaction,
  allItems, 
  onAddItem 
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.GAVE);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const balance = calculateBalance(customer);

  const handleOpenModal = (type: TransactionType) => {
    setEditingTransaction(null);
    setTransactionType(type);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionType(tx.type);
    setModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(customer.id, transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadPDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // primary color
    doc.text("Daily Transactions Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Customer Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Customer Details", 14, 40);
    doc.setFontSize(12);
    doc.text(`Name: ${customer.name}`, 14, 48);
    doc.text(`Phone: ${customer.phone}`, 14, 54);
    
    // Balance Summary
    const balanceText = balance >= 0 ? 'Net Balance (To Get)' : 'Net Balance (To Give)';
    doc.setFont("helvetica", "bold");
    doc.text(`${balanceText}: ${formatCurrency(Math.abs(balance))}`, 14, 64);
    doc.setFont("helvetica", "normal");
    
    // Transactions Table
    const tableData = [...customer.transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => [
      formatDate(tx.date),
      tx.items && tx.items.length > 0 
        ? tx.items.map(i => `${i.name} (x${i.quantity})`).join(', ') 
        : tx.description || 'Transaction',
      tx.type === TransactionType.GAVE ? 'GAVE' : 'GOT',
      formatCurrency(tx.amount)
    ]);

    (doc as any).autoTable({
      startY: 75,
      head: [['Date', 'Description', 'Type', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'GAVE') {
                data.cell.styles.textColor = [220, 38, 38]; // danger red
            } else {
                data.cell.styles.textColor = [22, 163, 74]; // success green
            }
        }
      }
    });

    doc.save(`${customer.name.replace(/\s+/g, '_')}_Transactions.pdf`);
  };

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Net Balance</p>
            <p className={`text-3xl font-black ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(Math.abs(balance))}
            </p>
          </div>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            PDF Report
          </button>
        </div>
        <div className={`text-sm font-black px-3 py-1 rounded-full inline-block ${balance >= 0 ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>
          {balance >= 0 ? 'YOU WILL GET' : 'YOU WILL GIVE'}
        </div>
      </div>

      <div className="space-y-3">
        {customer.transactions.length > 0 ? [...customer.transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
          <div key={tx.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-start group border border-slate-50">
            <div className="flex-grow">
               {tx.items && tx.items.length > 0 ? (
                 <div className="space-y-1">
                    {tx.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-slate-700 font-medium">{item.name} <span className="text-slate-400 font-normal">x{item.quantity} {item.unit || ''}</span></span>
                      </div>
                    ))}
                 </div>
               ) : (
                <p className="text-slate-800 font-bold">{tx.description || 'Transaction'}</p>
               )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(tx.date)}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${tx.type === TransactionType.GAVE ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>
                    {tx.type}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className={`font-black text-lg ${tx.type === TransactionType.GAVE ? 'text-danger' : 'text-success'}`}>
                {tx.type === TransactionType.GAVE ? '-' : '+'} {formatCurrency(tx.amount)}
              </p>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEditModal(tx)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-all uppercase"
                  title="Edit Transaction"
                >
                  <PencilIcon className="w-3 h-3" />
                  Edit
                </button>
                <span className="text-slate-200">|</span>
                <button 
                  onClick={() => setTransactionToDelete(tx)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-danger transition-all uppercase"
                  title="Delete Transaction"
                >
                  <TrashIcon className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )) : (
            <div className="text-center py-10 bg-white rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">No transactions recorded for this customer.</p>
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 grid grid-cols-2 gap-4 z-10">
        <button 
          onClick={() => handleOpenModal(TransactionType.GAVE)}
          className="bg-danger hover:bg-red-700 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
        >
          YOU GAVE
        </button>
        <button 
          onClick={() => handleOpenModal(TransactionType.GOT)}
          className="bg-success hover:bg-green-700 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95"
        >
          YOU GOT
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        transactionType={transactionType}
        onAddTransaction={(transaction) => onAddTransaction(customer.id, transaction)}
        onEditTransaction={(tx) => onEditTransaction(customer.id, tx)}
        transactionToEdit={editingTransaction}
        allItems={allItems}
        onAddItem={onAddItem}
      />

      <ConfirmationModal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this entry? This action cannot be undone."
      />
    </div>
  );
};

export default CustomerDetail;
