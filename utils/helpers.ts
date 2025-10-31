import { Customer, TransactionType } from '../types';

export const calculateBalance = (customer: Customer): number => {
  return customer.transactions.reduce((acc, tx) => {
    if (tx.type === TransactionType.GAVE) {
      return acc + tx.amount;
    } else {
      return acc - tx.amount;
    }
  }, 0);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
