import React from 'react';
import { CheckCircle2, Truck, PackagePlus, Recycle, Flag } from 'lucide-react';
import { formatDuration, type StageStats } from '@/lib/driver-stats-compute';
import { STAGES, classifyStage, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const ICON: Record<StageKey, any> = { approve: CheckCircle2, start: Truck, place: PackagePlus, pickup: Recycle, complete: Flag };
const BAR: Record<Quality, string> = { good: 'bg-emerald-400', ok: 'bg-amber-400', slow: 'bg-rose-500', neutral: 'bg-zinc-200' };
const TXT: Record<Quality, string> = { good: 'text-emerald-600', ok: 'text-amber-600', slow: 'text-rose-600', neutral: 'text-zinc-500' };

/**
 * Per-step averages for one driver over the period: median (headline), mean + n,
 * a magnitude bar, and the delta vs the fleet median. The core "how does this
 * driver spend time on each step" view.
 */
export function StepBreakdown({ stats, fleet }: { stats: StageStats; fleet?: StageStats }) {
  const controllable = STAGES.filter((s) => s.controllable);
  const maxMed = Math.max(1, ...controllable.map((s) => stats[s.key].median ?? 0));

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm divide-y divide-zinc-50">
      {STAGES.map((s) => {
        const st = stats[s.key];
        const med = st.median;
        const q: Quality = !s.controllable || med == null ? 'neutral' : classifyStage(s.key, med).quality;
        const pct = s.controllable && med != null ? Math.max(4, Math.min(100, (med / maxMed) * 100)) : 0;
        const fleetMed = fleet?.[s.key].median ?? null;
        const delta = med != null && fleetMed != null && s.controllable ? med - fleetMed : null;
        const Icon = ICON[s.key];

        return (
          <div key={s.key} className="px-4 sm:px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    s.controllable ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-50 text-zinc-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-800">
                    {s.title}
                    {!s.controllable && <span className="text-[11px] text-zinc-400 font-normal"> · аренда</span>}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {st.n > 0
                      ? `по ${st.n} ${st.n === 1 ? 'заказу' : 'заказам'}${st.mean != null ? ` · ср. ${formatDuration(st.mean)}` : ''}`
                      : 'нет данных'}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-lg font-extrabold tabular-nums ${TXT[q]}`}>{formatDuration(med)}</span>
                {delta != null && Math.abs(delta) >= 30 && (
                  <p className={`text-[10px] font-semibold ${delta > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {delta > 0 ? '+' : '−'}
                    {formatDuration(Math.abs(delta))} к парку
                  </p>
                )}
              </div>
            </div>
            {s.controllable && (
              <div className="mt-2.5 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div className={`h-full rounded-full ${BAR[q]}`} style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
