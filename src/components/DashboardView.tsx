import type { Expense } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import MetricCards from './MetricCards';
import ExpenseForm from './ExpenseForm';

interface DashboardViewProps {
  totalSpend: number;
  expenseCount: number;
  averageSpend: number;
  categoriesUsed: number;
  totalCategories: number;
  highestSpend: { amount: number; merchant: string } | null;
  currentWeekTotal: number;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

export default function DashboardView({
  totalSpend,
  expenseCount,
  averageSpend,
  categoriesUsed,
  totalCategories,
  highestSpend,
  currentWeekTotal,
  expenses,
  onAddExpense,
}: DashboardViewProps) {
  const activeDays = daysWithActivity(expenses);
  return (
    <div className="flex flex-col gap-6">
      {/* Hero: Current Week Total (always fixed, independent of filter) */}
      <div className="bg-[#161026]/60 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-cyber-pink/20 group">
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-2">
          This Week's Spend
        </p>
        <p className="text-4xl font-bold text-violet-100 tracking-tight group-hover:text-cyber-pink transition-colors duration-300">
          {formatCurrency(currentWeekTotal)}
        </p>
        <p className="text-xs text-violet-300/40 mt-2">
          Fixed — unaffected by period filter · {activeDays} day{activeDays !== 1 ? 's' : ''} with activity
        </p>
      </div>

      {/* Top Track — Quad Metric Row (filter-respecting) */}
      <MetricCards
        totalSpend={totalSpend}
        expenseCount={expenseCount}
        averageSpend={averageSpend}
        categoriesUsed={categoriesUsed}
        totalCategories={totalCategories}
        highestSpend={highestSpend}
      />

      {/* Middle Track — Expense Studio */}
      <ExpenseForm onAdd={onAddExpense} />
    </div>
  );
}

function daysWithActivity(expenses: Expense[]): number {
  const today = new Date();
  const dateStrs = new Set(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }),
  );
  return expenses.filter(e => dateStrs.has(e.date)).length;
}
