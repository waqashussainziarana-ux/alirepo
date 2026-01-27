
import { Customer, TransactionType } from '../types';

/**
 * Calculates the net balance for a customer.
 * Rounds to 2 decimal places to prevent floating point errors.
 */
export const calculateBalance = (customer: Customer): number => {
  const balance = customer.transactions.reduce((acc, tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === TransactionType.GAVE) {
      // Giving money increases the amount they owe you
      return acc + amount;
    } else {
      // Receiving money decreases the amount they owe you
      return acc - amount;
    }
  }, 0);
  
  // Robust rounding to 2 decimal places
  return Math.round((balance + Number.EPSILON) * 100) / 100;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
