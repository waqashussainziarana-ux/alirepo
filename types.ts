
export enum TransactionType {
  GAVE = 'GAVE', // You gave money to the customer, they owe you.
  GOT = 'GOT',   // You received money from the customer.
}

export interface Item {
  id: string;
  name: string;
  price: number;
  unit?: string;
  updatedAt?: string;
}

export interface TransactionItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string; // ISO 8601 format
  items: TransactionItem[];
  updatedAt?: string; // Essential for deep merging
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  transactions: Transaction[];
  updatedAt?: string;
}
