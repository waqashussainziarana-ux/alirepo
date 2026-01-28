
import { Customer, TransactionType } from '../types';

/**
 * Calculates the net balance for a customer.
 * Logic: GOT (+) and GAVE (-)
 * A negative balance means you have given more than you got (Customer owes you).
 * A positive balance means you have received more than you gave (You owe customer).
 */
export const calculateBalance = (customer: Customer): number => {
  const balance = customer.transactions.reduce((acc, tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === TransactionType.GAVE) {
      // Giving money is now treated as a negative cash flow entry (-)
      return acc - amount;
    } else {
      // Receiving money is treated as a positive cash flow entry (+)
      return acc + amount;
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
