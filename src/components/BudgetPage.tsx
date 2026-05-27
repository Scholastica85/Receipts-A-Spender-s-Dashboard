import { useState } from 'react';
import type { BudgetSettings } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import { calculateBudgetStatus } from '../utils/calculations';

interface BudgetPageProps {
  budget: BudgetSettings;
  onUpdateBudget: (settings: BudgetSettings) => void;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
}

function BudgetTrackerCard({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const { percentage, remaining, status } = calculateBudgetStatus(spent, budget);

  const barColor = status === 'not-set'
    ? 'bg-violet-950/40'
    : percentage > 100
      ? 'bg-cyber-pink'
      : percentage > 80
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const statusIcon = status === 'exceeded' ? '⚠' : status === 'on-track' ? '' : '';
  const statusText = status === 'not-set'
    ? 'No budget set'
    : status === 'exceeded'
      ? `Exceeded by ${formatCurrency(-remaining)}`
      : `${formatCurrency(remaining)} remaining`;

  const statusColor = status === 'exceeded'
    ? 'text-cyber-pink'
    : status === 'on-track'
      ? 'text-emerald-400'
      : 'text-violet-300/30';

  return (
    <div className="bg-[#161026]/60 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/20">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest">
          {label}
        </p>
        {status !== 'not-set' && (
          <span className={`text-xs font-semibold ${statusColor}`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      {status !== 'not-set' && (
        <div className="w-full h-2 bg-violet-950/40 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      <div className="flex items-baseline justify-between mb-1">
        <p className="text-2xl font-bold text-violet-100">
          {formatCurrency(spent)}
        </p>
        {status !== 'not-set' && (
          <p className="text-sm text-violet-300/40">
            of {formatCurrency(budget)}
          </p>
        )}
      </div>

      <p className={`text-xs ${statusColor}`}>
        {statusIcon} {statusText}
      </p>
    </div>
  );
}

function BudgetInputCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-[#161026]/60 border border-white/5 rounded-xl p-4 hover:border-violet-500/20 transition-all duration-200">
      <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-300/40 text-sm font-medium">
          $
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={e => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          placeholder="0.00"
          className="w-full pl-7 pr-3 py-2 bg-[#0F0A1C] border border-violet-950/40 rounded-lg text-sm text-violet-100 placeholder-violet-300/20 focus:outline-none focus:border-cyber-pink/50 transition-colors"
        />
      </div>
    </div>
  );
}

export function BudgetTracker({ budget, todayTotal, weekTotal, monthTotal }: {
  budget: BudgetSettings;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BudgetTrackerCard label="Daily Limit" spent={todayTotal} budget={budget.daily} />
      <BudgetTrackerCard label="Weekly Limit" spent={weekTotal} budget={budget.weekly} />
      <BudgetTrackerCard label="Monthly Limit" spent={monthTotal} budget={budget.monthly} />
    </div>
  );
}

export default function BudgetPage({ budget, onUpdateBudget, todayTotal, weekTotal, monthTotal }: BudgetPageProps) {
  const [daily, setDaily] = useState(budget.daily);
  const [weekly, setWeekly] = useState(budget.weekly);
  const [monthly, setMonthly] = useState(budget.monthly);

  function handleSave() {
    onUpdateBudget({ daily, weekly, monthly });
  }

  const hasChanges = daily !== budget.daily || weekly !== budget.weekly || monthly !== budget.monthly;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-violet-100">Budget</h3>
      </div>

      {/* Budget Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BudgetTrackerCard label="Daily Limit" spent={todayTotal} budget={budget.daily} />
        <BudgetTrackerCard label="Weekly Limit" spent={weekTotal} budget={budget.weekly} />
        <BudgetTrackerCard label="Monthly Limit" spent={monthTotal} budget={budget.monthly} />
      </div>

      {/* Budget Settings */}
      <div className="bg-[#161026]/40 border border-white/5 rounded-2xl p-5">
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-4">
          Set Budget Limits
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <BudgetInputCard label="Daily" value={daily} onChange={setDaily} />
          <BudgetInputCard label="Weekly" value={weekly} onChange={setWeekly} />
          <BudgetInputCard label="Monthly" value={monthly} onChange={setMonthly} />
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
            hasChanges
              ? 'bg-gradient-to-r from-cyber-pink to-electric-violet text-white shadow-lg shadow-cyber-pink/20 hover:shadow-cyber-pink/40'
              : 'bg-white/5 text-violet-300/20 cursor-not-allowed'
          }`}
        >
          {hasChanges ? 'Save Budget' : 'Saved'}
        </button>
      </div>

      {/* Feedback Summary */}
      <div className="bg-[#161026]/40 border border-white/5 rounded-2xl p-5">
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-3">
          Summary
        </p>
        <div className="space-y-2">
          <StatusRow label="Today" spent={todayTotal} budget={budget.daily} />
          <StatusRow label="This Week" spent={weekTotal} budget={budget.weekly} />
          <StatusRow label="This Month" spent={monthTotal} budget={budget.monthly} />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const { status, remaining } = calculateBudgetStatus(spent, budget);

  if (status === 'not-set') {
    return (
      <div className="flex items-center justify-between py-2 border-b border-violet-950/20 last:border-0">
        <span className="text-sm text-violet-300/60">{label}</span>
        <span className="text-xs text-violet-300/30">No budget set</span>
      </div>
    );
  }

  const isExceeded = status === 'exceeded';

  return (
    <div className="flex items-center justify-between py-2 border-b border-violet-950/20 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-violet-100">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isExceeded
            ? 'bg-cyber-pink/10 text-cyber-pink'
            : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {isExceeded ? 'Exceeded' : 'On Track'}
        </span>
      </div>
      <span className={`text-sm font-semibold ${isExceeded ? 'text-cyber-pink' : 'text-emerald-400'}`}>
        {isExceeded ? `-${formatCurrency(-remaining)}` : formatCurrency(remaining)} left
      </span>
    </div>
  );
}
