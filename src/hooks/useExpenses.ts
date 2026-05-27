import { useState, useEffect, useCallback } from 'react';
import type { Expense, Category } from '../types/expense';

const STORAGE_KEY = 'spender-dashboard-expenses';

const VALID_CATEGORIES: Category[] = ['Food', 'Transport', 'Data', 'Fun', 'Other'];

function migrateItem(item: Record<string, unknown>): Expense {
  const category = item.category as string;
  return {
    id: String(item.id ?? ''),
    merchant: String(item.merchant ?? ''),
    amount: Number(item.amount ?? 0),
    category: (VALID_CATEGORIES as readonly string[]).includes(category)
      ? (category as Category)
      : 'Other',
    date: String(item.date ?? ''),
    notes: String(item.notes ?? ''),
    createdAt: String(item.createdAt ?? ''),
  };
}

function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: unknown) => migrateItem(item as Record<string, unknown>));
  } catch {
    return [];
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      // Storage unavailable
    }
  }, [expenses]);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  }, []);

  return { expenses, addExpense };
}
