import { useState } from 'react';
import type { Category, Expense } from '../types/expense';
import { toISODate } from '../utils/formatters';

const CATEGORIES: Category[] = ['Food', 'Transport', 'Data', 'Fun', 'Other'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface ExpenseFormProps {
  onAdd: (expense: Expense) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) return;
    if (!DATE_REGEX.test(date)) return;

    onAdd({
      id: generateId(),
      merchant,
      amount: numAmount,
      category,
      date,
      notes,
      createdAt: new Date().toISOString(),
    });

    setMerchant('');
    setAmount('');
    setCategory('Food');
    setDate(toISODate(new Date()));
    setNotes('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#161026]/60 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-violet-500/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-cyber-pink/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-violet-100">New Expense</h3>
      </div>

      <div className="space-y-5">
        {/* Row 1: Merchant (full-width) */}
        <div>
          <label htmlFor="expense-merchant" className="text-[11px] text-violet-300/40 uppercase tracking-wider font-medium mb-1.5 block">
            Merchant / Description
          </label>
          <input
            type="text"
            id="expense-merchant"
            name="merchant"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
            placeholder="e.g., Starbucks Coffee"
            className="w-full px-4 py-3 bg-[#1E1435] border border-violet-950/40 rounded-xl text-violet-100 placeholder-violet-300/30 focus:outline-none focus:border-cyber-pink/50 focus:ring-1 focus:ring-cyber-pink/20 transition-all duration-300"
          />
        </div>

        {/* Row 2: Category + Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expense-category" className="text-[11px] text-violet-300/40 uppercase tracking-wider font-medium mb-1.5 block">
              Category
            </label>
            <select
              id="expense-category"
              name="category"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 bg-[#1E1435] border border-violet-950/40 rounded-xl text-violet-100 focus:outline-none focus:border-cyber-pink/50 focus:ring-1 focus:ring-cyber-pink/20 transition-all duration-300 appearance-none cursor-pointer"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="expense-amount" className="text-[11px] text-violet-300/40 uppercase tracking-wider font-medium mb-1.5 block">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-300/40 text-lg font-medium">
                $
              </span>
              <input
                type="text"
                id="expense-amount"
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-[#1E1435] border border-violet-950/40 rounded-xl text-violet-100 text-lg placeholder-violet-300/30 focus:outline-none focus:border-cyber-pink/50 focus:ring-1 focus:ring-cyber-pink/20 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Date + Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expense-date" className="text-[11px] text-violet-300/40 uppercase tracking-wider font-medium mb-1.5 block">
              Date
            </label>
            <input
              type="date"
              id="expense-date"
              name="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#1E1435] border border-violet-950/40 rounded-xl text-violet-100 focus:outline-none focus:border-cyber-pink/50 focus:ring-1 focus:ring-cyber-pink/20 transition-all duration-300"
            />
          </div>
          <div>
            <label htmlFor="expense-notes" className="text-[11px] text-violet-300/40 uppercase tracking-wider font-medium mb-1.5 block">
              Notes / Details
            </label>
            <input
              type="text"
              id="expense-notes"
              name="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-4 py-3 bg-[#1E1435] border border-violet-950/40 rounded-xl text-violet-100 placeholder-violet-300/30 focus:outline-none focus:border-cyber-pink/50 focus:ring-1 focus:ring-cyber-pink/20 transition-all duration-300"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 bg-cyber-pink text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyber-pink/25 transition-all duration-300 active:scale-[0.98]"
        >
          Add to Log
        </button>
      </div>
    </form>
  );
}
