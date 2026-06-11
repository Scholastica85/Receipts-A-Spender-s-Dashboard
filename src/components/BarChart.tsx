import { useId, useState, useEffect } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyTotal } from '../types/expense';
import { formatCurrency } from '../utils/formatters';

interface BarChartProps {
  data: DailyTotal[];
  title?: string;
}

interface TooltipPayloadItem {
  value: number;
  payload: { label: string; amount: number; date: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div className="backdrop-blur-xl bg-[#161026]/90 border border-violet-950/40 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm text-violet-300/60">{label}</p>
      <p className="text-lg font-bold text-electric-violet">{formatCurrency(item.value)}</p>
    </div>
  );
}

interface CustomBarShape {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

const renderCustomBar = (props: CustomBarShape) => {
  const { fill, x, y, width, height } = props;
  return (
    <rect
      x={x ?? 0}
      y={y ?? 0}
      width={width ?? 0}
      height={height ?? 0}
      rx={6}
      ry={6}
      fill={fill ?? '#9D4EDD'}
    />
  );
};

export default function BarChart({ data, title = 'Daily Spending' }: BarChartProps) {
  const uid = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="w-full h-[300px] bg-transparent" />;
  const hasData = data.length > 0;
  return (
    <div className="h-full flex flex-col bg-[#161026]/60 border border-violet-950/40 rounded-2xl p-4 lg:p-5 overflow-hidden">
      <h3 className="text-[11px] lg:text-xs font-semibold text-violet-300/60 uppercase tracking-wider shrink-0">
        {title}
      </h3>
      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-violet-300/30 text-xs">
          No transactions found for this selected period
        </div>
      ) : (
      <div className="flex-1 min-h-0 mt-3">
        <div className="w-full min-w-0 relative h-[200px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
          <RechartsBarChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`${uid}barGradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D946EF" />
                <stop offset="100%" stopColor="#9D4EDD" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B5E82', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B5E82', fontSize: 11 }}
              tickFormatter={v => `$${v}`}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            />
            <Bar
              dataKey="amount"
              shape={renderCustomBar}
              fill={`url(#${uid}barGradient)`}
              maxBarSize={40}
              animationDuration={600}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
        </div>
      </div>
      )}
    </div>
  );
}
