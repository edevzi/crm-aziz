import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatDuration } from '@/lib/driver-stats-compute';
import type { DriverStat } from '@/lib/driver-stats';
import { stageQuality, type Quality } from '@/lib/driver-stats-meta';

const BAR_COLOR: Record<Quality, string> = {
  good: 'bg-emerald-500',
  ok: 'bg-amber-500',
  slow: 'bg-rose-500',
  neutral: 'bg-slate-300',
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0] || '').join('').toUpperCase();
}

function Row({
  d,
  max,
  suffix,
  metric,
  dim,
}: {
  d: DriverStat;
  max: number;
  suffix: string;
  metric: 'approve' | 'total';
  dim: boolean;
}) {
  const v = d.avg[metric];
  const q = !dim && metric === 'approve' ? stageQuality('approve', v) : 'neutral';
  const pct = v == null ? 0 : Math.max(3, (v / max) * 100);

  return (
    <Link
      href={`/driver-stats/${d.driverId}${suffix}`}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 transition-colors ${
        dim ? 'opacity-60 hover:opacity-80 hover:bg-slate-50/60' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-10 w-10 rounded-full font-extrabold text-sm flex items-center justify-center flex-shrink-0 ${dim ? 'bg-slate-50 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
          {initials(d.name)}
        </div>
        <div className="min-w-0">
          <p className={`font-bold leading-tight truncate ${dim ? 'text-slate-500' : 'text-slate-900'}`}>{d.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {d.vehiclePlate} · {d.orderCount > 0 ? `${d.orderCount} зак.` : 'нет заказов'}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex flex-col gap-1">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${BAR_COLOR[q]} transition-[width] duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-base sm:text-lg font-extrabold tabular-nums whitespace-nowrap ${dim ? 'text-slate-400' : 'text-slate-900'}`}>
          {formatDuration(v)}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
      </div>

      <div className="col-span-3 sm:hidden">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${BAR_COLOR[q]}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

/**
 * Driver leaderboard. Working drivers come first, idle drivers (0 orders this
 * period) are visible but visually demoted with a divider so the operator can
 * see them without confusing them for "fast at 0 minutes".
 */
export function DriverLeaderboard({
  drivers,
  suffix,
  metric = 'approve',
}: {
  drivers: DriverStat[];
  suffix: string;
  metric?: 'approve' | 'total';
}) {
  const working = drivers.filter((d) => d.orderCount > 0);
  const idle = drivers.filter((d) => d.orderCount === 0);
  const values = working.map((d) => d.avg[metric]).filter((v): v is number => v != null);
  const max = Math.max(1, ...values);

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {working.map((d) => (
          <li key={d.driverId}>
            <Row d={d} max={max} suffix={suffix} metric={metric} dim={false} />
          </li>
        ))}
      </ul>
      {idle.length > 0 && (
        <>
          <div className="px-4 sm:px-5 py-2 border-t border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Не работали в этом периоде · {idle.length}
          </div>
          <ul className="divide-y divide-slate-100">
            {idle.map((d) => (
              <li key={d.driverId}>
                <Row d={d} max={max} suffix={suffix} metric={metric} dim={true} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
