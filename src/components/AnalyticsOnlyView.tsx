import { useState, useMemo } from 'react';
import type { Expense, CategoryTotal, DailyTotal, Category } from '../types/expense';
import DonutChart from './DonutChart';
import BarChart from './BarChart';
import { toISODate } from '../utils/formatters';

type FilterMode = 'all' | 'day' | 'month' | 'year';

interface AnalyticsOnlyViewProps {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#FF2E93',
  Transport: '#D946EF',
  Data: '#9D4EDD',
  Fun: '#7C3AED',
  Other: '#6D28D9',
};

const CATEGORIES: Category[] = ['Food', 'Transport', 'Data', 'Fun', 'Other'];

const MODES: { key: FilterMode; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' }).format(d);
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + '-01');
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(d);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function computeCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const map = new Map<Category, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return CATEGORIES.map(cat => ({
    category: cat,
    total: map.get(cat) ?? 0,
    percentage: total > 0 ? ((map.get(cat) ?? 0) / total) * 100 : 0,
    color: CATEGORY_COLORS[cat],
  }));
}

function computeDailyTotalsAll(expenses: Expense[]): DailyTotal[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date,
      label: formatDayLabel(date),
      amount,
    }));
}

function computeDailyTotalsMonth(expenses: Expense[], month: string): DailyTotal[] {
  const parts = month.split('-');
  const year = parseInt(parts[0] ?? '', 10);
  const m = parseInt(parts[1] ?? '', 10);
  const daysInMonth = getDaysInMonth(year, m);

  const map = new Map<string, number>();
  for (const e of expenses) {
    if (e.date.startsWith(month)) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
    }
  }

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const date = `${month}-${day}`;
    const d = new Date(year, m - 1, i + 1);
    const label = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' }).format(d);
    return { date, label, amount: map.get(date) ?? 0 };
  });
}

function computeMonthlyTotals(expenses: Expense[]): DailyTotal[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const month = e.date.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      date: month,
      label: formatMonthYear(month),
      amount,
    }));
}

export default function AnalyticsOnlyView({ expenses }: AnalyticsOnlyViewProps) {
  const todayStr = useMemo(() => toISODate(new Date()), []);
  const currentMonth = todayStr.slice(0, 7);
  const currentYear = todayStr.slice(0, 4);

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedValue, setSelectedValue] = useState(todayStr);

  const handleModeChange = (mode: FilterMode) => {
    setFilterMode(mode);
    if (mode === 'all') return;
    if (mode === 'day') setSelectedValue(todayStr);
    else if (mode === 'month') setSelectedValue(currentMonth);
    else if (mode === 'year') setSelectedValue(currentYear);
  };

  const filteredExpenses = useMemo(() => {
    if (filterMode === 'all') return expenses;
    if (filterMode === 'day') return expenses.filter(e => e.date === selectedValue);
    if (filterMode === 'month') return expenses.filter(e => e.date.startsWith(selectedValue));
    if (filterMode === 'year') return expenses.filter(e => e.date.startsWith(selectedValue));
    return expenses;
  }, [expenses, filterMode, selectedValue]);

  const categoryTotals = useMemo(
    () => computeCategoryTotals(filteredExpenses),
    [filteredExpenses],
  );

  const dailyTotals = useMemo(() => {
    if (filterMode === 'all') return computeDailyTotalsAll(filteredExpenses);
    if (filterMode === 'day') {
      const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);
      return [{
        date: selectedValue,
        label: formatShortDate(selectedValue),
        amount: total,
      }];
    }
    if (filterMode === 'month') return computeDailyTotalsMonth(filteredExpenses, selectedValue);
    if (filterMode === 'year') return computeMonthlyTotals(filteredExpenses);
    return [];
  }, [filteredExpenses, filterMode, selectedValue]);

  const hasData = filteredExpenses.length > 0;

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const e of expenses) {
      years.add(parseInt(e.date.slice(0, 4), 10));
    }
    const arr = [...years];
    const min = arr.length > 0 ? Math.min(2024, ...arr) : 2024;
    const max = arr.length > 0 ? Math.max(2026, ...arr) : 2026;
    const result: number[] = [];
    for (let y = min; y <= max; y++) result.push(y);
    return result;
  }, [expenses]);

  const barTitle = filterMode === 'all' ? 'Daily Spending'
    : filterMode === 'day' ? formatShortDate(selectedValue)
    : filterMode === 'month' ? formatMonthYear(selectedValue)
    : `Year ${selectedValue}`;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-electric-violet/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-electric-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="text-sm md:text-base font-semibold text-violet-100">Analytics</h3>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
        <div className="grid grid-cols-4 md:flex rounded-xl bg-obsidian/80 border border-violet-950/40 p-1 gap-1">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                filterMode === key
                  ? 'bg-cyber-pink/15 text-cyber-pink shadow-sm'
                  : 'text-violet-300/40 hover:text-violet-300/70 hover:bg-white/[0.03]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filterMode === 'day' && (
          <input
            type="date"
            id="filter-date"
            name="filter-date"
            value={selectedValue}
            onChange={e => setSelectedValue(e.target.value)}
            className="min-h-[44px] md:min-h-0 w-full md:w-auto bg-input-bg border border-violet-950/40 rounded-xl px-3 py-1.5 text-xs text-violet-100 focus:outline-none focus:ring-1 focus:ring-cyber-pink/30 transition-all duration-200"
          />
        )}
        {filterMode === 'month' && (
          <input
            type="month"
            id="filter-month"
            name="filter-month"
            value={selectedValue}
            onChange={e => setSelectedValue(e.target.value)}
            className="min-h-[44px] md:min-h-0 w-full md:w-auto bg-input-bg border border-violet-950/40 rounded-xl px-3 py-1.5 text-xs text-violet-100 focus:outline-none focus:ring-1 focus:ring-cyber-pink/30 transition-all duration-200"
          />
        )}
        {filterMode === 'year' && (
          <select
            id="filter-year"
            name="filter-year"
            value={selectedValue}
            onChange={e => setSelectedValue(e.target.value)}
            className="min-h-[44px] md:min-h-0 w-full md:w-auto bg-input-bg border border-violet-950/40 rounded-xl pl-3 pr-8 py-1.5 text-xs text-violet-100 focus:outline-none focus:ring-1 focus:ring-cyber-pink/30 transition-all duration-200 appearance-none"
          >
            {yearOptions.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
          <div className="backdrop-blur-xl bg-[#161026]/40 border border-violet-950/30 rounded-2xl px-6 md:px-8 py-8 md:py-10 text-center">
            <svg className="w-8 md:w-10 h-8 md:h-10 text-violet-300/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-violet-300/40">No transactions found for this selected period</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
          <div className="min-w-0 w-full h-[280px] sm:h-[320px] md:h-[350px] lg:h-[400px]">
            <DonutChart data={categoryTotals} />
          </div>
          <div className="min-w-0 w-full h-[280px] sm:h-[320px] md:h-[350px] lg:h-[400px]">
            <BarChart data={dailyTotals} title={barTitle} />
          </div>
        </div>
      )}
    </div>
  );
}
