import React from 'react';
import { CheckCircle2, Truck, PackagePlus, Recycle, Flag } from 'lucide-react';
import { formatDuration, type StageStats } from '@/lib/driver-stats-compute';
import { STAGES, classifyStage, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const ICON: Record<StageKey, any> = { approve: CheckCircle2, start: Truck, place: PackagePlus, pickup: Recycle, complete: Flag };
const TXT: Record<Quality, string> = { good: 'text-emerald-600', ok: 'text-amber-600', slow: 'text-rose-600', neutral: 'text-zinc-500' };

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-zinc-900">{value}</div>
      <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>
    </div>
  );
}

/** Overall statistics across ALL drivers for the period — sits above the per-driver board. */
export function FleetSummary({
  orderCount,
  completedCount,
  driverCount,
  totalDriverCount,
  medianWorkSec,
  stats,
}: {
  orderCount: number;
  completedCount: number;
  driverCount: number;
  totalDriverCount: number;
  medianWorkSec: number | null;
  stats: StageStats;
}) {
  const pct = orderCount ? Math.round((completedCount / orderCount) * 100) : 0;

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4">
        <Kpi label="Заказов" value={orderCount} sub={`${completedCount} завершено`} />
        <Kpi label="Завершено" value={`${pct}%`} sub="из всех заказов" />
        <Kpi label="Водителей" value={`${driverCount}/${totalDriverCount}`} sub="работали в периоде" />
        <Kpi label="Работа / заказ" value={formatDuration(medianWorkSec)} sub="медиана, без аренды" />
      </div>

      <div className="border-t border-zinc-100 px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Среднее по этапам</span>
        {STAGES.map((s) => {
          const m = stats[s.key].median;
          const q: Quality = !s.controllable || m == null ? 'neutral' : classifyStage(s.key, m).quality;
          const Icon = ICON[s.key];
          return (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-zinc-300" />
              <span className="text-[11px] text-zinc-500">
                {s.title.split(' ')[0]}
                {!s.controllable && <span className="text-zinc-300"> (аренда)</span>}
              </span>
              <span className={`text-sm font-bold tabular-nums ${TXT[q]}`}>{formatDuration(m)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
