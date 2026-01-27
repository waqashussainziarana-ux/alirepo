
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
      if (balance > 0) {
        acc.totalToGet += balance;
      } else if (balance < 0) {
        acc.totalToGive += Math.abs(balance);
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
      <div className="bg-green-100 border-l-4 border-success p-4 rounded-r-lg shadow">
        <p className="text-sm text-green-800">You will get</p>
        <p className="text-2xl font-bold text-success">{formatCurrency(totalToGet)}</p>
      </div>
      <div className="bg-red-100 border-l-4 border-danger p-4 rounded-r-lg shadow">
        <p className="text-sm text-red-800">You will give</p>
        <p className="text-2xl font-bold text-danger">{formatCurrency(totalToGive)}</p>
      </div>
    </div>
  );
};

export default DashboardSummary;
