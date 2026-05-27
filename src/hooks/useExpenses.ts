import { useState, useEffect, useCallback } from 'react';
import type { Expense, Category } from '../types/expense';

const STORAGE_KEY = 'spender-dashboard-expenses';

const VALID_CATEGORIES: Category[] = ['Food', 'Transport', 'Data', 'Fun', 'Other'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_EXPENSES: Expense[] = [
  // ── This Week (Mon May 25 – Sun May 31, 2026) ── 15 items
  { id: 'seed-001', merchant: 'Starbucks Coffee', amount: 5.75, category: 'Food', date: '2026-05-25', notes: 'Morning latte', createdAt: '2026-05-25T07:32:00.000Z' },
  { id: 'seed-002', merchant: 'Chipotle Burrito', amount: 14.25, category: 'Food', date: '2026-05-25', notes: 'Lunch with coworkers', createdAt: '2026-05-25T12:15:00.000Z' },
  { id: 'seed-003', merchant: 'Whole Foods Groceries', amount: 67.30, category: 'Food', date: '2026-05-25', notes: 'Weekly groceries', createdAt: '2026-05-25T18:40:00.000Z' },
  { id: 'seed-004', merchant: 'MetroCard Refill', amount: 34.00, category: 'Transport', date: '2026-05-26', notes: 'Monthly unlimited', createdAt: '2026-05-26T08:05:00.000Z' },
  { id: 'seed-005', merchant: 'Domino\'s Pizza', amount: 21.50, category: 'Food', date: '2026-05-26', notes: 'Dinner delivery', createdAt: '2026-05-26T19:15:00.000Z' },
  { id: 'seed-006', merchant: 'AWS Cloud Scale', amount: 89.12, category: 'Data', date: '2026-05-27', notes: 'EC2 + RDS monthly', createdAt: '2026-05-27T06:00:00.000Z' },
  { id: 'seed-007', merchant: 'Sushi Bar', amount: 32.50, category: 'Food', date: '2026-05-27', notes: 'Lunch meeting', createdAt: '2026-05-27T12:30:00.000Z' },
  { id: 'seed-008', merchant: 'Cinema Multiplex', amount: 18.00, category: 'Fun', date: '2026-05-27', notes: 'Wednesday preview', createdAt: '2026-05-27T20:00:00.000Z' },
  { id: 'seed-009', merchant: 'Shell Gas', amount: 48.75, category: 'Transport', date: '2026-05-28', notes: 'Filled tank', createdAt: '2026-05-28T07:45:00.000Z' },
  { id: 'seed-010', merchant: 'Target Essentials', amount: 42.00, category: 'Other', date: '2026-05-28', notes: 'Household supplies', createdAt: '2026-05-28T15:20:00.000Z' },
  { id: 'seed-011', merchant: 'GitHub Copilot', amount: 10.00, category: 'Data', date: '2026-05-29', notes: 'Monthly subscription', createdAt: '2026-05-29T09:00:00.000Z' },
  { id: 'seed-012', merchant: 'Thai Takeout', amount: 19.80, category: 'Food', date: '2026-05-29', notes: 'Friday night dinner', createdAt: '2026-05-29T19:30:00.000Z' },
  { id: 'seed-013', merchant: 'Concert Tickets', amount: 120.00, category: 'Fun', date: '2026-05-30', notes: 'Live band admission ×2', createdAt: '2026-05-30T18:00:00.000Z' },
  { id: 'seed-014', merchant: 'Walgreens Pharmacy', amount: 15.50, category: 'Other', date: '2026-05-30', notes: 'Vitamins', createdAt: '2026-05-30T11:10:00.000Z' },
  { id: 'seed-015', merchant: 'Farmers Market', amount: 28.00, category: 'Food', date: '2026-05-31', notes: 'Sunday produce haul', createdAt: '2026-05-31T10:30:00.000Z' },

  // ── Last Week (Mon May 18 – Sun May 24, 2026) ── 15 items
  { id: 'seed-016', merchant: 'Dunkin\' Donuts', amount: 4.50, category: 'Food', date: '2026-05-18', notes: 'Coffee & bagel', createdAt: '2026-05-18T07:15:00.000Z' },
  { id: 'seed-017', merchant: 'Uber Ride', amount: 22.30, category: 'Transport', date: '2026-05-18', notes: 'Airport drop-off', createdAt: '2026-05-18T09:45:00.000Z' },
  { id: 'seed-018', merchant: 'MongoDB Atlas', amount: 57.00, category: 'Data', date: '2026-05-18', notes: 'Cluster tier M10', createdAt: '2026-05-18T14:00:00.000Z' },
  { id: 'seed-019', merchant: 'Trader Joe\'s', amount: 45.80, category: 'Food', date: '2026-05-19', notes: 'Snacks & frozen', createdAt: '2026-05-19T17:25:00.000Z' },
  { id: 'seed-020', merchant: 'Spotify Premium', amount: 11.99, category: 'Fun', date: '2026-05-19', notes: 'Monthly family plan', createdAt: '2026-05-19T22:00:00.000Z' },
  { id: 'seed-021', merchant: 'Lyft Trip', amount: 15.75, category: 'Transport', date: '2026-05-20', notes: 'Evening ride home', createdAt: '2026-05-20T19:10:00.000Z' },
  { id: 'seed-022', merchant: 'Amazon Prime', amount: 14.99, category: 'Other', date: '2026-05-20', notes: 'Monthly membership', createdAt: '2026-05-20T08:00:00.000Z' },
  { id: 'seed-023', merchant: 'Bakery Fresh', amount: 8.75, category: 'Food', date: '2026-05-20', notes: 'Croissant & juice', createdAt: '2026-05-20T11:30:00.000Z' },
  { id: 'seed-024', merchant: 'Parking Garage', amount: 18.00, category: 'Transport', date: '2026-05-21', notes: 'Downtown parking', createdAt: '2026-05-21T13:00:00.000Z' },
  { id: 'seed-025', merchant: 'Netflix Subscription', amount: 15.99, category: 'Fun', date: '2026-05-21', notes: 'Premium plan', createdAt: '2026-05-21T06:30:00.000Z' },
  { id: 'seed-026', merchant: 'Datadog Monitoring', amount: 45.00, category: 'Data', date: '2026-05-22', notes: 'Pro plan 5 hosts', createdAt: '2026-05-22T09:15:00.000Z' },
  { id: 'seed-027', merchant: 'Italian Restaurant', amount: 65.00, category: 'Food', date: '2026-05-22', notes: 'Date night dinner', createdAt: '2026-05-22T20:00:00.000Z' },
  { id: 'seed-028', merchant: 'Bowling Alley', amount: 36.00, category: 'Fun', date: '2026-05-23', notes: 'Two games + shoes', createdAt: '2026-05-23T16:45:00.000Z' },
  { id: 'seed-029', merchant: 'Home Depot Supplies', amount: 54.20, category: 'Other', date: '2026-05-23', notes: 'Paint & brushes', createdAt: '2026-05-23T11:30:00.000Z' },
  { id: 'seed-030', merchant: 'Apple iCloud', amount: 2.99, category: 'Other', date: '2026-05-24', notes: '200 GB plan', createdAt: '2026-05-24T07:00:00.000Z' },

  // ── All Time (before Mon May 18, 2026) ── 20 items
  { id: 'seed-031', merchant: 'Cloudflare DNS', amount: 20.00, category: 'Data', date: '2026-05-15', notes: 'Pro subscription', createdAt: '2026-05-15T10:00:00.000Z' },
  { id: 'seed-032', merchant: 'Taco Stand', amount: 11.50, category: 'Food', date: '2026-05-15', notes: 'Lunch quick bite', createdAt: '2026-05-15T12:45:00.000Z' },
  { id: 'seed-033', merchant: 'Nintendo eShop', amount: 59.99, category: 'Fun', date: '2026-05-10', notes: 'Zelda DLC', createdAt: '2026-05-10T15:00:00.000Z' },
  { id: 'seed-034', merchant: 'Shell Gas', amount: 52.10, category: 'Transport', date: '2026-05-10', notes: 'Full tank', createdAt: '2026-05-10T08:30:00.000Z' },
  { id: 'seed-035', merchant: 'Panera Bread', amount: 13.25, category: 'Food', date: '2026-05-05', notes: 'Soup & sandwich', createdAt: '2026-05-05T12:15:00.000Z' },
  { id: 'seed-036', merchant: 'DigitalOcean Droplet', amount: 24.00, category: 'Data', date: '2026-05-05', notes: 'Basic droplet', createdAt: '2026-05-05T06:30:00.000Z' },
  { id: 'seed-037', merchant: 'Uber Ride', amount: 28.50, category: 'Transport', date: '2026-05-01', notes: 'Airport pickup', createdAt: '2026-05-01T22:15:00.000Z' },
  { id: 'seed-038', merchant: 'Costco Wholesale', amount: 156.40, category: 'Food', date: '2026-05-01', notes: 'Bulk monthly stock', createdAt: '2026-05-01T14:30:00.000Z' },
  { id: 'seed-039', merchant: 'IKEA Furniture', amount: 245.00, category: 'Other', date: '2026-04-25', notes: 'Desk & chair', createdAt: '2026-04-25T11:00:00.000Z' },
  { id: 'seed-040', merchant: 'Amtrak Ticket', amount: 85.00, category: 'Transport', date: '2026-04-25', notes: 'Round trip', createdAt: '2026-04-25T16:45:00.000Z' },
  { id: 'seed-041', merchant: 'Best Buy Electronics', amount: 129.99, category: 'Fun', date: '2026-04-20', notes: 'Wireless headphones', createdAt: '2026-04-20T13:20:00.000Z' },
  { id: 'seed-042', merchant: 'T-Mobile Bill', amount: 85.00, category: 'Data', date: '2026-04-20', notes: 'Monthly plan', createdAt: '2026-04-20T09:00:00.000Z' },
  { id: 'seed-043', merchant: 'Pizza Hut', amount: 24.99, category: 'Food', date: '2026-04-10', notes: 'Family dinner', createdAt: '2026-04-10T19:30:00.000Z' },
  { id: 'seed-044', merchant: 'Walmart', amount: 73.40, category: 'Other', date: '2026-04-10', notes: 'General supplies', createdAt: '2026-04-10T15:10:00.000Z' },
  { id: 'seed-045', merchant: 'Adobe Creative Cloud', amount: 54.99, category: 'Data', date: '2026-03-30', notes: 'Photography plan', createdAt: '2026-03-30T08:00:00.000Z' },
  { id: 'seed-046', merchant: 'Starbucks Coffee', amount: 6.45, category: 'Food', date: '2026-03-30', notes: 'Cold brew', createdAt: '2026-03-30T07:50:00.000Z' },
  { id: 'seed-047', merchant: 'Marvel Movie Tickets', amount: 36.00, category: 'Fun', date: '2026-03-15', notes: 'IMAX ×2', createdAt: '2026-03-15T14:30:00.000Z' },
  { id: 'seed-048', merchant: 'Uber Eats', amount: 31.20, category: 'Food', date: '2026-03-15', notes: 'Sunday dinner delivery', createdAt: '2026-03-15T19:00:00.000Z' },
  { id: 'seed-049', merchant: 'Verizon Internet', amount: 74.99, category: 'Data', date: '2026-02-28', notes: 'Fios monthly', createdAt: '2026-02-28T10:00:00.000Z' },
  { id: 'seed-050', merchant: 'CVS Pharmacy', amount: 22.50, category: 'Other', date: '2026-02-28', notes: 'Prescription copay', createdAt: '2026-02-28T16:20:00.000Z' },
];

function migrateItem(item: Record<string, unknown>): Expense {
  const category = item.category as string;
  const rawAmount = Number(item.amount ?? 0);
  const rawDate = String(item.date ?? '');
  return {
    id: String(item.id ?? ''),
    merchant: String(item.merchant ?? ''),
    amount: isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 0,
    category: (VALID_CATEGORIES as readonly string[]).includes(category)
      ? (category as Category)
      : 'Other',
    date: DATE_REGEX.test(rawDate) ? rawDate : '',
    notes: String(item.notes ?? ''),
    createdAt: String(item.createdAt ?? ''),
  };
}

function loadDefault(): Expense[] {
  return DEFAULT_EXPENSES.map(e => migrateItem(e as unknown as Record<string, unknown>));
}

function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return loadDefault();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return loadDefault();
    return parsed.map((item: unknown) => migrateItem(item as Record<string, unknown>));
  } catch {
    return loadDefault();
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      setStorageError(null);
    } catch (err) {
      const msg = err instanceof DOMException
        ? err.name === 'QuotaExceededError'
          ? 'Storage is full. Free up space or remove old expenses.'
          : err.name === 'SecurityError'
            ? 'Browser storage access is blocked. Check your privacy settings.'
            : `Storage error: ${err.message}`
        : 'Unable to save data to local storage.';
      setStorageError(msg);
    }
  }, [expenses]);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  }, []);

  const clearStorageError = useCallback(() => setStorageError(null), []);

  return { expenses, addExpense, storageError, clearStorageError };
}
