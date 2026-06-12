import { useId, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { CategoryTotal } from '../types/expense';
import { formatCurrency } from '../utils/formatters';

interface DonutChartProps {
  data: CategoryTotal[];
}

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { name: string; value: number; color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const RADIAN = Math.PI / 180;

function renderLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: LabelProps) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#A89BBF"
      textAnchor={x > cx ? 'start' : 'end'}
      fontSize={11}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div className="backdrop-blur-xl bg-[#161026]/90 border border-violet-950/40 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-violet-100">{item.name}</p>
      <p className="text-lg font-bold text-cyber-pink">{formatCurrency(item.value)}</p>
    </div>
  );
}

export default function DonutChart({ data }: DonutChartProps) {
  const uid = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="w-full h-[300px] bg-transparent" />;

  const chartData = data.filter(d => d.total > 0).map(d => ({
    name: d.category,
    value: d.total,
    color: d.color,
  }));

  const hasData = chartData.length > 0;

  return (
    <div className="h-full flex flex-col bg-[#161026]/60 border border-violet-950/40 rounded-2xl p-4 lg:p-5 overflow-hidden">
      <h3 className="text-[11px] lg:text-xs font-semibold text-violet-300/60 uppercase tracking-wider shrink-0">
        Spending by Category
      </h3>
      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-violet-300/30 text-xs">
          No category data for this period
        </div>
      ) : (
        <div className="flex flex-row-reverse items-center justify-center w-full min-w-0 h-[200px] gap-2 sm:flex-col sm:h-auto sm:flex-1">
          <div className="w-[55%] h-full sm:w-full sm:flex-1 sm:min-h-0">
            <div className="w-full min-w-0 relative h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={index} id={`${uid}donutGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={`url(#${uid}donutGrad${index})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
          <div className="w-[42%] sm:w-full text-[11px] sm:text-xs flex flex-col space-y-1 sm:grid sm:grid-cols-5 sm:gap-1 sm:mt-3 shrink-0 sm:space-y-0 pl-1.5 sm:pl-0 mt-8 sm:mt-0">
            {data.map(d => (
              <div
                key={d.category}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors duration-200"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <div className="min-w-0">
                  <p className="text-violet-300/40 truncate leading-tight">{d.category}</p>
                  <p className="font-semibold text-violet-100/70 leading-tight">
                    {d.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
