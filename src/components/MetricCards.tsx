import { formatCurrency } from '../utils/formatters';

interface MetricCardsProps {
  totalSpend: number;
  expenseCount: number;
  averageSpend: number;
  categoriesUsed: number;
  totalCategories: number;
  highestSpend: { amount: number; merchant: string } | null;
}

export default function MetricCards({
  totalSpend,
  expenseCount,
  averageSpend,
  categoriesUsed,
  totalCategories,
  highestSpend,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Spend */}
      <div className="bg-[#161026]/60 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/20 group relative overflow-hidden">
        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-electric-violet/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-electric-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-1.5">
          Total Spend
        </p>
        <p className="text-2xl font-bold text-violet-100 tracking-tight group-hover:text-cyber-pink transition-colors duration-300">
          {formatCurrency(totalSpend)}
        </p>
        <p className="text-[11px] text-violet-300/40 mt-1.5">
          {expenseCount} transaction{expenseCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Receipts Count */}
      <div className="bg-[#161026]/60 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/20 group relative overflow-hidden">
        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-cyber-pink/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-1.5">
          Receipts
        </p>
        <p className="text-2xl font-bold text-violet-100 tracking-tight group-hover:text-cyber-pink transition-colors duration-300">
          {expenseCount}
        </p>
        <p className="text-[11px] text-violet-300/40 mt-1.5">
          Avg {formatCurrency(averageSpend)} per receipt
        </p>
      </div>

      {/* Categories Used */}
      <div className="bg-[#161026]/60 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/20 group relative overflow-hidden">
        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-electric-violet/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-electric-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-1.5">
          Categories
        </p>
        <p className="text-2xl font-bold text-violet-100 tracking-tight group-hover:text-cyber-pink transition-colors duration-300">
          {categoriesUsed}
          <span className="text-sm font-normal text-violet-300/40 ml-1">
            / {totalCategories}
          </span>
        </p>
        <p className="text-[11px] text-violet-300/40 mt-1.5">
          {categoriesUsed} of {totalCategories} categories used
        </p>
      </div>

      {/* Highest Single Spend */}
      <div className="bg-[#161026]/60 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/20 group relative overflow-hidden">
        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-cyber-pink/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-[10px] font-medium text-violet-300/50 uppercase tracking-widest mb-1.5">
          Highest Spend
        </p>
        <p className="text-2xl font-bold text-violet-100 tracking-tight group-hover:text-cyber-pink transition-colors duration-300">
          {highestSpend ? formatCurrency(highestSpend.amount) : '$0.00'}
        </p>
        <p className="text-[11px] text-violet-300/40 mt-1.5 truncate">
          {highestSpend ? highestSpend.merchant : 'No expenses yet'}
        </p>
      </div>
    </div>
  );
}
