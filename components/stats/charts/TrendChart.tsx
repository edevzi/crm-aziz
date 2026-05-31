'use client';

import React from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatDuration, type DaySeriesPoint } from '@/lib/driver-stats-compute';
import { TOOLTIP_STYLE } from './palette';

/** Daily trend: order count (bars) + median driver-work per order (area line). */
export function TrendChart({ series }: { series: DaySeriesPoint[] }) {
  const data = series.map((p) => ({
    label: p.label,
    Заказы: p.orders,
    workMin: p.workMedianSec != null ? Math.round(p.workMedianSec / 60) : null,
  }));

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Динамика по дням</div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ left: -10, right: 8, top: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="workGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f4f4f5" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="orders" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} width={26} allowDecimals={false} />
          <YAxis yAxisId="work" orientation="right" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} width={34} unit="м" />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: '#fafafa' }}
            formatter={(value: number, name: string) =>
              name === 'Работа' ? [formatDuration(value * 60), name] : [value, name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
          <Bar yAxisId="orders" dataKey="Заказы" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
          <Area
            yAxisId="work"
            type="monotone"
            dataKey="workMin"
            name="Работа"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#workGrad)"
            connectNulls
            dot={{ r: 2.5, fill: '#6366f1' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
