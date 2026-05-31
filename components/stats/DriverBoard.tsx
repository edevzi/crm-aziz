'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDuration, type DriverStat } from '@/lib/driver-stats-compute';
import { STAGES, classifyStage, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const STEPS = STAGES.filter((s) => s.controllable); // принял, выехал, установил, завершил
type SortKey = 'orders' | 'work' | StageKey;

const TXT: Record<Quality, string> = {
  good: 'text-emerald-600',
  ok: 'text-amber-600',
  slow: 'text-rose-600',
  neutral: 'text-zinc-300',
};

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

const GRID = 'grid grid-cols-[1.7fr_0.7fr_repeat(4,1fr)_0.9fr] gap-2 items-center';

/**
 * Per-driver comparison board. Each row is one driver; columns are the median
 * time on each controllable step + the median driver-work per order. Click any
 * column header to rank drivers by it; click a row to open that driver.
 */
export function DriverBoard({ drivers, suffix }: { drivers: DriverStat[]; suffix: string }) {
  const [sort, setSort] = useState<SortKey>('work');
  const working = drivers.filter((d) => d.orderCount > 0);
  const idle = drivers.filter((d) => d.orderCount === 0);

  const valueOf = (d: DriverStat, k: SortKey): number | null =>
    k === 'orders' ? d.orderCount : k === 'work' ? d.medianWorkSec : d.stats[k].median;

  const sorted = [...working].sort((a, b) => {
    const av = valueOf(a, sort);
    const bv = valueOf(b, sort);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return sort === 'orders' ? bv - av : av - bv; // orders: most first; times: fastest first
  });

  const Head = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSort(k)}
      className={`text-right text-[10px] font-bold uppercase tracking-wide transition-colors ${
        sort === k ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
      }`}
    >
      {label}
      {sort === k ? ' ↓' : ''}
    </button>
  );

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className={`${GRID} px-4 sm:px-5 py-3 border-b border-zinc-100`}>
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Водитель</span>
            <Head k="orders" label="Заказы" />
            {STEPS.map((s) => (
              <Head key={s.key} k={s.key} label={s.title.split(' ')[0]} />
            ))}
            <Head k="work" label="Работа" />
          </div>

          <div className="divide-y divide-zinc-50">
            {sorted.map((d, i) => (
              <Link
                key={d.driverId}
                href={`/driver-stats/${d.driverId}${suffix}`}
                className={`${GRID} px-4 sm:px-5 py-3 hover:bg-zinc-50/70 transition-colors`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-bold text-zinc-300 w-3 text-right">{i + 1}</span>
                  <span className="h-9 w-9 rounded-full bg-zinc-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {initials(d.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{d.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{d.vehiclePlate}</p>
                  </div>
                </div>
                <span className="text-right text-sm font-bold text-zinc-700 tabular-nums">
                  {d.completedCount}
                  <span className="text-zinc-300">/{d.orderCount}</span>
                </span>
                {STEPS.map((s) => {
                  const m = d.stats[s.key].median;
                  const q: Quality = m == null ? 'neutral' : classifyStage(s.key, m).quality;
                  return (
                    <span key={s.key} className={`text-right text-sm font-bold tabular-nums ${TXT[q]}`}>
                      {m == null ? '—' : formatDuration(m)}
                    </span>
                  );
                })}
                <span className="text-right text-sm font-extrabold text-zinc-900 tabular-nums">
                  {formatDuration(d.medianWorkSec)}
                </span>
              </Link>
            ))}
          </div>

          {idle.length > 0 && (
            <div className="px-4 sm:px-5 py-2.5 bg-zinc-50/50 text-[11px] text-zinc-400 border-t border-zinc-100">
              Не работали в этом периоде: {idle.map((d) => d.name).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
