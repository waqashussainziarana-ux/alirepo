
import React from 'react';
import { Customer } from '../types';
import { calculateBalance, formatCurrency } from '../utils/helpers';

interface DashboardSummaryProps {
  customers: Customer[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ customers }) => {
  const totals = customers.reduce(
    (acc, customer) => {
      const balance = calculateBalance(customer);
      // Logic with flip:
      // balance < 0: Gave more than Got (Customer owes you - "You will get")
      // balance > 0: Got more than Gave (You owe customer - "You will give")
      if (balance < 0) {
        acc.totalToGet += Math.abs(balance);
      } else if (balance > 0) {
        acc.totalToGive += balance;
      }
      return acc;
    },
    { totalToGet: 0, totalToGive: 0 }
  );

  // Rounding final totals to ensure clean display
  const totalToGet = Math.round((totals.totalToGet + Number.EPSILON) * 100) / 100;
  const totalToGive = Math.round((totals.totalToGive + Number.EPSILON) * 100) / 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-red-50 border-l-4 border-danger p-4 rounded-r-lg shadow-sm">
        <p className="text-xs font-bold text-red-800 uppercase tracking-tight">You will get</p>
        <p className="text-2xl font-black text-danger">{formatCurrency(totalToGet)}</p>
      </div>
      <div className="bg-green-50 border-l-4 border-success p-4 rounded-r-lg shadow-sm">
        <p className="text-xs font-bold text-green-800 uppercase tracking-tight">You will give</p>
        <p className="text-2xl font-black text-success">{formatCurrency(totalToGive)}</p>
      </div>
    </div>
  );
};

export default DashboardSummary;
