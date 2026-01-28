
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
      if (balance < 0) {
        acc.totalToGet += Math.abs(balance);
      } else if (balance > 0) {
        acc.totalToGive += balance;
      }
      return acc;
    },
    { totalToGet: 0, totalToGive: 0 }
  );

  const netBalance = totals.totalToGive - totals.totalToGet;
  const netLabel = netBalance > 0 ? 'Net Payable' : netBalance < 0 ? 'Net Receivable' : 'Balanced';
  const netColor = netBalance > 0 ? 'text-success' : netBalance < 0 ? 'text-danger' : 'text-slate-400';

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 gap-3">
        {/* You will get Card */}
        <div className="bg-white p-4 rounded-xl border-b-4 border-danger shadow-sm flex flex-col justify-between h-24">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">You will get</p>
          <p className="text-xl font-black text-danger truncate">
            {formatCurrency(Math.round(totals.totalToGet))}
          </p>
        </div>

        {/* You will give Card */}
        <div className="bg-white p-4 rounded-xl border-b-4 border-success shadow-sm flex flex-col justify-between h-24">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">You will give</p>
          <p className="text-xl font-black text-success truncate">
            {formatCurrency(Math.round(totals.totalToGive))}
          </p>
        </div>
      </div>

      {/* Net Balance Status */}
      <div className="bg-white border border-slate-100 rounded-full py-2 px-4 shadow-sm flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{netLabel}</span>
        <span className={`text-sm font-black ${netColor}`}>
          {formatCurrency(Math.abs(netBalance))}
        </span>
      </div>
    </div>
  );
};

export default DashboardSummary;