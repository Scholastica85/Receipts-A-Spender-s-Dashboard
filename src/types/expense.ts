export type Category = 'Food' | 'Transport' | 'Data' | 'Fun' | 'Other';

export type FilterPeriod = 'this-week' | 'last-week' | 'all-time';

export type ActiveView = 'dashboard' | 'expenses' | 'analytics' | 'budget' | 'settings';

export interface BudgetSettings {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  date: string;
  notes: string;
  createdAt: string;
}

export interface DailyTotal {
  date: string;
  label: string;
  amount: number;
}

export interface CategoryTotal {
  category: Category;
  total: number;
  percentage: number;
  color: string;
}
