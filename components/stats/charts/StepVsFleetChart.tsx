'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatDuration, type StageStats } from '@/lib/driver-stats-compute';
import { STEP_COLOR, TOOLTIP_STYLE } from './palette';
import { STAGES, type StageKey } from '@/lib/driver-stats-meta';

const STEPS: StageKey[] = ['approve', 'start', 'place', 'complete'];

/** Grouped bar — this driver's median per step vs the fleet median. */
export function StepVsFleetChart({ stats, fleet }: { stats: StageStats; fleet: StageStats }) {
  const data = STEPS.map((k) => {
    const meta = STAGES.find((s) => s.key === k)!;
    return {
      step: meta.title.split(' ')[0],
      key: k,
      n: stats[k].n,
      Водитель: Math.round((stats[k].median ?? 0) / 60),
      Парк: Math.round((fleet[k].median ?? 0) / 60),
    };
  });

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Этапы · водитель против парка</div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ left: -8, right: 8, top: 4, bottom: 0 }} barGap={4}>
          <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#52525b', fontWeight: 600 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} unit="м" width={40} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: '#fafafa' }}
            formatter={(value: number, name: string) => [formatDuration(value * 60), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
          <Bar dataKey="Водитель" radius={[5, 5, 0, 0]} maxBarSize={34} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.key} fill={STEP_COLOR[d.key]} />
            ))}
          </Bar>
          <Bar dataKey="Парк" fill="#d4d4d8" radius={[5, 5, 0, 0]} maxBarSize={34} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
