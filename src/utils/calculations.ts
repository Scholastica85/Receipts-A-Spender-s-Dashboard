import type { Expense, FilterPeriod, DailyTotal, CategoryTotal, Category } from '../types/expense';
import { toISODate } from './formatters';

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#FF2E93',
  Transport: '#D946EF',
  Data: '#9D4EDD',
  Fun: '#7C3AED',
  Other: '#6D28D9',
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function getWeekRange(period: 'this-week' | 'last-week'): { start: Date; end: Date } {
  const now = new Date();
  const monday = getMonday(now);

  if (period === 'last-week') {
    monday.setDate(monday.getDate() - 7);
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
}

function generateWeekDates(period: 'this-week' | 'last-week'): string[] {
  const { start } = getWeekRange(period);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISODate(d);
  });
}

export function filterExpenses(expenses: Expense[], period: FilterPeriod): Expense[] {
  if (period === 'all-time') return expenses;

  const { start, end } = getWeekRange(period);
  const startStr = toISODate(start);
  const endStr = toISODate(end);
  return expenses.filter(e => e.date >= startStr && e.date <= endStr);
}

export function calculateDailyTotals(expenses: Expense[], period: FilterPeriod): DailyTotal[] {
  const filtered = filterExpenses(expenses, period);

  const dateTotals = new Map<string, number>();
  for (const e of filtered) {
    dateTotals.set(e.date, (dateTotals.get(e.date) ?? 0) + e.amount);
  }

  let dates: string[];
  if (period === 'all-time') {
    dates = [...dateTotals.keys()].sort((a, b) => a.localeCompare(b));
    if (dates.length === 0) {
      const today = new Date();
      dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 6 + i);
        return toISODate(d);
      });
    }
  } else {
    dates = generateWeekDates(period);
  }

  return dates.map(date => {
    const amount = dateTotals.get(date) ?? 0;
    const d = new Date(date + 'T00:00:00');
    const label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    return { date, label, amount };
  });
}

export function calculateCategoryTotals(expenses: Expense[], period: FilterPeriod): CategoryTotal[] {
  const filtered = filterExpenses(expenses, period);
  const totalSpend = filtered.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = new Map<Category, number>();
  for (const e of filtered) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount);
  }

  const categories: Category[] = ['Food', 'Transport', 'Data', 'Fun', 'Other'];

  return categories.map(category => {
    const catTotal = categoryMap.get(category) ?? 0;
    return {
      category,
      total: catTotal,
      percentage: totalSpend > 0 ? (catTotal / totalSpend) * 100 : 0,
      color: CATEGORY_COLORS[category],
    };
  });
}

export function calculateTotalSpend(expenses: Expense[], period: FilterPeriod): number {
  return filterExpenses(expenses, period).reduce((sum, e) => sum + e.amount, 0);
}

export function calculateExpenseCount(expenses: Expense[], period: FilterPeriod): number {
  return filterExpenses(expenses, period).length;
}

export function calculateAverageSpend(expenses: Expense[], period: FilterPeriod): number {
  const filtered = filterExpenses(expenses, period);
  const count = filtered.length;
  if (count === 0) return 0;
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);
  return total / count;
}

export function calculateCategoriesUsed(expenses: Expense[], period: FilterPeriod): number {
  const filtered = filterExpenses(expenses, period);
  return new Set(filtered.map(e => e.category)).size;
}

export function calculateHighestSpend(
  expenses: Expense[], period: FilterPeriod,
): { amount: number; merchant: string } | null {
  const filtered = filterExpenses(expenses, period);
  if (filtered.length === 0) return null;
  const result = filtered.reduce((max, e) => (e.amount > max.amount ? e : max), filtered[0]!);
  return { amount: result.amount, merchant: result.merchant };
}

function generateRolling7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    return toISODate(d);
  });
}

export function calculateLast7Days(expenses: Expense[]): DailyTotal[] {
  const dates = generateRolling7Days();
  const start = dates[0]!;
  const end = dates[6]!;

  const dateTotals = new Map<string, number>();
  for (const e of expenses) {
    if (e.date >= start && e.date <= end) {
      dateTotals.set(e.date, (dateTotals.get(e.date) ?? 0) + e.amount);
    }
  }

  return dates.map(date => {
    const amount = dateTotals.get(date) ?? 0;
    const d = new Date(date + 'T00:00:00');
    const label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    return { date, label, amount };
  });
}

export function calculateTodayTotal(expenses: Expense[]): number {
  const today = toISODate(new Date());
  return expenses
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

export function calculateMonthTotal(expenses: Expense[]): number {
  const { start, end } = getMonthRange();
  const startStr = toISODate(start);
  const endStr = toISODate(end);
  return expenses
    .filter(e => e.date >= startStr && e.date <= endStr)
    .reduce((sum, e) => sum + e.amount, 0);
}

export interface BudgetStatus {
  spent: number;
  budget: number;
  percentage: number;
  remaining: number;
  status: 'on-track' | 'exceeded' | 'not-set';
}

export function calculateBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) {
    return { spent, budget, percentage: 0, remaining: 0, status: 'not-set' };
  }
  const percentage = (spent / budget) * 100;
  const remaining = budget - spent;
  const status = spent > budget ? 'exceeded' : 'on-track';
  return { spent, budget, percentage, remaining, status };
}

export function calculateCurrentWeekTotal(expenses: Expense[]): number {
  const { start, end } = getWeekRange('this-week');
  const startStr = toISODate(start);
  const endStr = toISODate(end);
  return expenses
    .filter(e => e.date >= startStr && e.date <= endStr)
    .reduce((sum, e) => sum + e.amount, 0);
}
