import { useState } from 'react';
import type { Expense, FilterPeriod, Category } from '../types/expense';
import { filterExpenses } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface ExpenseLogViewProps {
  expenses: Expense[];
  period: FilterPeriod;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#FF2E93',
  Transport: '#D946EF',
  Data: '#9D4EDD',
  Fun: '#7C3AED',
  Other: '#6D28D9',
};

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDayHeader(dateStr: string): string {
  const today = new Date();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return formatFullDate(dateStr);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function ExpenseModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#161026] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}
                />
                <span className="text-xs font-semibold text-violet-300/60 uppercase tracking-wider">
                  {expense.category}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-violet-300/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-lg font-bold text-violet-100 mb-1">{expense.merchant || expense.category}</p>
            <p className="text-[32px] font-bold text-white mb-6">{formatCurrency(expense.amount)}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-violet-300/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-violet-100">{formatFullDate(expense.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-violet-300/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-violet-100">{formatTime(expense.createdAt)}</span>
              </div>
              {expense.notes ? (
                <div className="flex items-start gap-3 text-sm">
                  <svg className="w-4 h-4 text-violet-300/30 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <p className="text-violet-300/60 leading-relaxed">{expense.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ExpenseLogView({ expenses, period }: ExpenseLogViewProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const filtered = filterExpenses(expenses, period);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const grouped = new Map<string, Expense[]>();
  for (const expense of sorted) {
    const list = grouped.get(expense.date);
    if (list) {
      list.push(expense);
    } else {
      grouped.set(expense.date, [expense]);
    }
  }

  const dayGroups = [...grouped.entries()];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyber-pink/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-violet-100">Expense Log</h3>
        <span className="text-xs text-violet-300/40 ml-auto">
          {sorted.length} record{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {selectedExpense && (
        <ExpenseModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
      )}

      {dayGroups.length === 0 ? (
        <div className="flex items-center justify-center py-16 bg-[#161026]/40 border border-white/5 rounded-2xl">
          <p className="text-sm text-violet-300/30">No expenses recorded for this period</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dayGroups.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-violet-300/60 uppercase tracking-wider">
                  {formatDayHeader(date)}
                </span>
                <span className="h-px flex-1 bg-violet-950/30" />
                <span className="text-[10px] text-violet-300/30 font-medium">
                  {items.length} item{items.length !== 1 ? 's' : ''} · {formatCurrency(items.reduce((sum, e) => sum + e.amount, 0))}
                </span>
              </div>
              <div className="space-y-2">
                {items.map(expense => (
                  <div
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className="flex items-center justify-between p-4 bg-[#161026]/60 border border-white/5 rounded-xl hover:border-violet-500/20 hover:bg-[#161026]/80 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-violet-100">
                          {expense.merchant || expense.category}
                        </p>
                        <p className="text-xs text-violet-300/40 mt-0.5">
                          {expense.category}
                          {expense.notes ? ` · ${expense.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-base font-bold text-violet-100 shrink-0 ml-4">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
