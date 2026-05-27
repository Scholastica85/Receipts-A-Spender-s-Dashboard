import { type ReactNode } from 'react';
import type { FilterPeriod } from '../types/expense';

interface FilterTabsProps {
  active: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
  vertical?: boolean;
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="w-[16px] h-[16px] shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const TABS: { value: FilterPeriod; label: string; icon: ReactNode }[] = [
  {
    value: 'this-week', label: 'This Week',
    icon: <SvgIcon><rect x="3" y="4" width="14" height="14" rx="2" /><path d="M3 9h14M7 2v3M13 2v3" /></SvgIcon>,
  },
  {
    value: 'last-week', label: 'Last Week',
    icon: <SvgIcon><rect x="3" y="4" width="14" height="14" rx="2" /><path d="M3 9h14M7 2v3M13 2v3" /><path d="M8 14l-2 2 2 2M6 16h5a2 2 0 001.5-.5" /></SvgIcon>,
  },
  {
    value: 'all-time', label: 'All Time',
    icon: <SvgIcon><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2.5" /></SvgIcon>,
  },
];

export default function FilterTabs({ active, onChange, vertical = false }: FilterTabsProps) {
  if (vertical) {
    return (
      <nav className="space-y-1">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
              active === tab.value
                ? 'bg-cyber-pink/10 text-cyber-pink'
                : 'text-violet-300/40 hover:text-violet-300/70 hover:bg-white/[0.03]'
            }`}
          >
            <span className={`shrink-0 transition-colors duration-300 ${
              active === tab.value ? 'text-cyber-pink' : 'text-violet-950/60'
            }`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="inline-flex rounded-xl bg-[#161026] p-1 border border-violet-950/40">
      {TABS.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
            active === tab.value
              ? 'bg-cyber-pink text-white shadow-lg shadow-cyber-pink/30'
              : 'text-violet-300/40 hover:text-violet-300/70'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
