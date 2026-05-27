import type { CategoryTotal, DailyTotal } from '../types/expense';
import DonutChart from './DonutChart';
import BarChart from './BarChart';

interface AnalyticsOnlyViewProps {
  categoryTotals: CategoryTotal[];
  dailyTotals: DailyTotal[];
}

export default function AnalyticsOnlyView({ categoryTotals, dailyTotals }: AnalyticsOnlyViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-electric-violet/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-electric-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-violet-100">Analytics</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="h-[400px]">
          <DonutChart data={categoryTotals} />
        </div>
        <div className="h-[400px]">
          <BarChart data={dailyTotals} />
        </div>
      </div>
    </div>
  );
}
