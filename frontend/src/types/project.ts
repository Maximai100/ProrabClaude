import { Quote } from './quote';

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  address: string;
  status: 'active' | 'completed' | 'archived';
  notes: string;
  client?: Client;
  client_id?: number;
  total_quote_amount: string;
  total_expenses: string;
  total_payments_received: string;
  expected_profit: string;
  balance_due: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  amount: string;
  description: string;
  receipt_photo?: string;
  expense_date: string;
  created_at: string;
}

export interface ProjectPayment {
  id: number;
  amount: string;
  description: string;
  payment_date: string;
  created_at: string;
}

export interface ProjectDetail extends Project {
  quotes: Quote[];
  expenses: Expense[];
  payments_received: ProjectPayment[];
}
