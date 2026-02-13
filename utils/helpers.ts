
import { Customer, TransactionType } from '../types';

/**
 * Calculates the net balance for a customer.
 * Logic: GOT (+) and GAVE (-)
 */
export const calculateBalance = (customer: Customer): number => {
  const balance = customer.transactions.reduce((acc, tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === TransactionType.GAVE) {
      return acc - amount;
    } else {
      return acc + amount;
    }
  }, 0);
  
  return Math.round((balance + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates gross totals for a customer.
 * totalGave: Sum of all GAVE transactions (Credit extended)
 * totalGot: Sum of all GOT transactions (Payments received)
 */
export const calculateCustomerTotals = (customer: Customer) => {
  return customer.transactions.reduce((acc, tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === TransactionType.GAVE) {
      acc.totalGave += amount;
    } else {
      acc.totalGot += amount;
    }
    return acc;
  }, { totalGave: 0, totalGot: 0 });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
