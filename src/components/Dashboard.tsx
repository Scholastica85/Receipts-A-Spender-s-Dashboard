import { useState, useMemo, type ReactNode } from 'react';
import type { FilterPeriod, ActiveView } from '../types/expense';
import { useExpenses } from '../hooks/useExpenses';
import { useBudget } from '../hooks/useBudget';
import {
  calculateTotalSpend,
  calculateExpenseCount,
  calculateAverageSpend,
  calculateCategoriesUsed,
  calculateHighestSpend,
  calculateDailyTotals,
  calculateCategoryTotals,
  calculateCurrentWeekTotal,
  calculateTodayTotal,
  calculateMonthTotal,
} from '../utils/calculations';
import FilterTabs from './FilterTabs';
import DashboardView from './DashboardView';
import ExpenseLogView from './ExpenseLogView';
import AnalyticsOnlyView from './AnalyticsOnlyView';
import SettingsView from './SettingsView';
import BudgetPage, { BudgetTracker } from './BudgetPage';
import MetricCards from './MetricCards';
import DonutChart from './DonutChart';
import BarChart from './BarChart';

const TOTAL_CATEGORIES = 5;

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: ReactNode }[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <SvgIcon><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></SvgIcon>,
  },
  {
    id: 'expenses', label: 'Expense Log',
    icon: <SvgIcon><path d="M4 4h12v14l-3-2-3 2-3-2-3 2V4z" /><path d="M7 8h6M7 11h6" /></SvgIcon>,
  },
  {
    id: 'analytics', label: 'Analytics',
    icon: <SvgIcon><path d="M3 17V9M8 17V5M13 17v-6M18 17v-3" /></SvgIcon>,
  },
  {
    id: 'budget', label: 'Budget',
    icon: <SvgIcon><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></SvgIcon>,
  },
  {
    id: 'settings', label: 'Settings',
    icon: <SvgIcon><circle cx="10" cy="10" r="3" /><path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.95 4.05l-1.41 1.41M5.46 14.54l-1.41 1.41M15.95 15.95l-1.41-1.41M5.46 5.46L4.05 4.05" /></SvgIcon>,
  },
];

export default function Dashboard() {
  const { expenses, addExpense, storageError: expenseStorageError, clearStorageError: clearExpenseError } = useExpenses();
  const { budget, updateBudget, storageError: budgetStorageError, clearStorageError: clearBudgetError } = useBudget();
  const [period, setPeriod] = useState<FilterPeriod>('this-week');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isPeriodView, setIsPeriodView] = useState(false);

  const {
    totalSpend,
    todayTotal,
    weekTotal,
    monthTotal,
    expenseCount,
    averageSpend,
    categoriesUsed,
    highestSpend,
    dailyTotals,
    categoryTotals,
    currentWeekTotal,
  } = useMemo(() => ({
    totalSpend: calculateTotalSpend(expenses, period),
    todayTotal: calculateTodayTotal(expenses),
    weekTotal: calculateCurrentWeekTotal(expenses),
    monthTotal: calculateMonthTotal(expenses),
    expenseCount: calculateExpenseCount(expenses, period),
    averageSpend: calculateAverageSpend(expenses, period),
    categoriesUsed: calculateCategoriesUsed(expenses, period),
    highestSpend: calculateHighestSpend(expenses, period),
    dailyTotals: calculateDailyTotals(expenses, period),
    categoryTotals: calculateCategoryTotals(expenses, period),
    currentWeekTotal: calculateCurrentWeekTotal(expenses),
  }), [expenses, period]);

  function handleNavigate(view: ActiveView) {
    setActiveView(view);
    setIsPeriodView(false);
  }

  function handlePeriodChange(period: FilterPeriod) {
    setPeriod(period);
    setIsPeriodView(true);
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#0F0A1C] text-violet-100">
      {/* ── Sidebar: hidden on mobile, icon-rail on tablet, full on desktop ── */}
      <aside className="hidden md:flex md:flex-col md:w-16 lg:w-64 h-full shrink-0 border-r border-violet-950/30 bg-[#161026] md:justify-between md:py-4 md:px-2 lg:px-6 lg:py-6 transition-all duration-300 overflow-hidden">
        <div>
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8 lg:mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-electric-violet shadow-lg shadow-cyber-pink/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h12v14l-3-2-3 2-3-2-3 2V4z" />
                <path d="M7 8.5h6M7 11.5h6" />
              </svg>
            </div>
            <div className="hidden lg:block">
              <p className="text-base font-bold text-violet-100 tracking-tight">MyReceipt</p>
              <p className="text-[11px] text-violet-300/40 tracking-wide">A Spender's Dashboard</p>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`group relative w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  activeView === item.id && !isPeriodView
                    ? 'bg-cyber-pink/10 text-cyber-pink'
                    : 'text-violet-300/40 hover:text-violet-300/70 hover:bg-white/[0.03]'
                }`}
              >
                <span className={`shrink-0 transition-colors duration-300 ${
                  activeView === item.id && !isPeriodView ? 'text-cyber-pink' : 'text-violet-300/40'
                }`}>
                  {item.icon}
                </span>
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-[#161026] border border-violet-950/40 text-xs text-violet-100 font-medium shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 lg:hidden">
                  {item.label}
                </span>
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block space-y-5">
          <div>
            <p className="text-[10px] text-violet-300/40 uppercase tracking-widest mb-2">PERIOD</p>
            <FilterTabs vertical active={period} onChange={handlePeriodChange} />
          </div>
          <div className="pt-4 border-t border-violet-950/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyber-pink to-electric-violet flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-violet-100 truncate">Amaka Scholastica</p>
              <p className="text-[11px] text-violet-300/40 truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8 flex flex-col gap-4 md:gap-6 relative">
        {expenseStorageError && (
          <div className="shrink-0 backdrop-blur-xl bg-amber-500/15 border border-amber-400/30 rounded-xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-amber-500/5">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-amber-200/90 flex-1">{expenseStorageError}</p>
            <button onClick={clearExpenseError} className="text-amber-300/50 hover:text-amber-200 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {budgetStorageError && (
          <div className="shrink-0 backdrop-blur-xl bg-amber-500/15 border border-amber-400/30 rounded-xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-amber-500/5">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-amber-200/90 flex-1">{budgetStorageError}</p>
            <button onClick={clearBudgetError} className="text-amber-300/50 hover:text-amber-200 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {isPeriodView ? (
          <>
            <MetricCards
              totalSpend={totalSpend}
              expenseCount={expenseCount}
              averageSpend={averageSpend}
              categoriesUsed={categoriesUsed}
              totalCategories={TOTAL_CATEGORIES}
              highestSpend={highestSpend}
            />

            <BudgetTracker budget={budget} todayTotal={todayTotal} weekTotal={weekTotal} monthTotal={monthTotal} />

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyber-pink/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyber-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-violet-100">
                  Expenses · {period === 'this-week' ? 'This Week' : period === 'last-week' ? 'Last Week' : 'All Time'}
                </h3>
              </div>
              <ExpenseLogView expenses={expenses} period={period} />
            </div>

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-electric-violet/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-electric-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-violet-100">Analytics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
                  <DonutChart data={categoryTotals} />
                </div>
                <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
                  <BarChart data={dailyTotals} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <DashboardView
                totalSpend={totalSpend}
                expenseCount={expenseCount}
                averageSpend={averageSpend}
                categoriesUsed={categoriesUsed}
                totalCategories={TOTAL_CATEGORIES}
                highestSpend={highestSpend}
                currentWeekTotal={currentWeekTotal}
                expenses={expenses}
                onAddExpense={addExpense}
              />
            )}
            {activeView === 'expenses' && (
              <ExpenseLogView expenses={expenses} period={period} />
            )}
            {activeView === 'analytics' && (
              <AnalyticsOnlyView expenses={expenses} />
            )}
            {activeView === 'budget' && (
              <BudgetPage
                budget={budget}
                onUpdateBudget={updateBudget}
                todayTotal={todayTotal}
                weekTotal={weekTotal}
                monthTotal={monthTotal}
              />
            )}
            {activeView === 'settings' && (
              <SettingsView />
            )}
          </>
        )}
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161026]/95 backdrop-blur-xl border-t border-violet-950/30">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 min-w-0 flex-1 h-full rounded-lg transition-all duration-200 ${
                activeView === item.id && !isPeriodView
                  ? 'text-cyber-pink'
                  : 'text-violet-300/40'
              }`}
            >
              <span className={`w-5 h-5 shrink-0 ${
                activeView === item.id && !isPeriodView ? 'text-cyber-pink' : 'text-violet-300/40'
              }`}>
                {item.icon}
              </span>
              <span className="text-[10px] leading-tight truncate font-medium">
                {item.label === 'Expense Log' ? 'Expenses' : item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
