import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyTotal } from '../types/expense';
import { formatCurrency } from '../utils/formatters';

interface BarChartProps {
  data: DailyTotal[];
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

export default function BarChart({ data }: BarChartProps) {
  return (
    <div className="h-full flex flex-col bg-[#161026]/60 border border-violet-950/40 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-violet-300/60 uppercase tracking-wider shrink-0">
        Daily Spending
      </h3>
      <div className="flex-1 min-h-0 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
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
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            />
            <Bar
              dataKey="amount"
              shape={renderCustomBar}
              fill="url(#barGradient)"
              maxBarSize={40}
              animationDuration={600}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
