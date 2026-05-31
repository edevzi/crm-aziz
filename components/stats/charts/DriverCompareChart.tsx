'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDuration, type DriverStat } from '@/lib/driver-stats-compute';
import { DRIVER_COLORS, TOOLTIP_STYLE } from './palette';
import { STAGES, type StageKey } from '@/lib/driver-stats-meta';

const STEPS: StageKey[] = ['approve', 'start', 'place', 'complete'];

/** Grouped bars — per step, one colored bar per driver, side by side. Head-to-head per step. */
export function DriverCompareChart({ drivers }: { drivers: DriverStat[] }) {
  const working = drivers.filter((d) => d.orderCount > 0);
  if (!working.length) return null;

  const data = STEPS.map((k) => {
    const meta = STAGES.find((s) => s.key === k)!;
    const row: Record<string, number | string> = { step: meta.title.split(' ')[0] };
    working.forEach((d) => {
      row[d.name] = Math.round((d.stats[k].median ?? 0) / 60);
    });
    return row;
  });

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Время на этап по водителям</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: -8, right: 8, top: 6, bottom: 0 }} barCategoryGap="22%" barGap={2}>
          <CartesianGrid vertical={false} stroke="#f4f4f5" />
          <XAxis dataKey="step" tick={{ fontSize: 12, fill: '#3f3f46', fontWeight: 600 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} unit="м" width={42} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: '#fafafa' }}
            formatter={(value: number, name: string) => [formatDuration(value * 60), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
          {working.map((d, i) => (
            <Bar
              key={d.driverId}
              dataKey={d.name}
              fill={DRIVER_COLORS[i % DRIVER_COLORS.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
