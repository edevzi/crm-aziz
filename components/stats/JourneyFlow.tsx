import React from 'react';
import { CheckCircle2, Truck, PackagePlus, Recycle, Flag, ChevronRight } from 'lucide-react';
import type { StageDurations } from '@/lib/driver-stats-compute';
import { formatDuration } from '@/lib/driver-stats-compute';
import { STAGES, stageQuality, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const ICONS: Record<StageKey, any> = {
  approve: CheckCircle2,
  start: Truck,
  place: PackagePlus,
  pickup: Recycle,
  complete: Flag,
};

// Gradient per stage (visual identity, not performance colour)
const GRAD: Record<StageKey, string> = {
  approve: 'from-violet-500 to-indigo-500',
  start: 'from-sky-500 to-blue-500',
  place: 'from-teal-500 to-emerald-500',
  pickup: 'from-fuchsia-500 to-purple-500',
  complete: 'from-emerald-500 to-green-600',
};

const Q: Record<Quality, { tile: string; text: string; dot: string }> = {
  good: { tile: 'bg-emerald-50/70 ring-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ok: { tile: 'bg-amber-50/70 ring-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  slow: { tile: 'bg-rose-50/70 ring-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  neutral: { tile: 'bg-slate-50 ring-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

/**
 * Order journey — average time per lifecycle stage.
 * Mobile-first: stacks vertically on small screens, horizontal on ≥sm.
 */
export function JourneyFlow({ durations }: { durations: StageDurations }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-1.5">
      {STAGES.map((s, i) => {
        const Icon = ICONS[s.key];
        const seconds = durations[s.key];
        const q = stageQuality(s.key, seconds);
        const st = Q[q];
        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div className="hidden sm:flex items-center text-slate-300 flex-shrink-0 self-center">
                <ChevronRight className="h-5 w-5" />
              </div>
            )}
            <div className={`flex-1 rounded-2xl ring-1 ${st.tile} px-3 py-3 flex items-center sm:flex-col gap-3 sm:gap-2 sm:text-center`}>
              <div className="relative flex-shrink-0">
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${GRAD[s.key]} flex items-center justify-center shadow`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {!s.neutral && (
                  <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ${st.dot} ring-2 ring-white`} />
                )}
              </div>
              <div className="flex-1 sm:flex-none min-w-0">
                <p className="text-[11px] font-bold text-slate-600 leading-tight">{s.title}</p>
                <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${st.text}`}>{formatDuration(seconds)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.neutral ? 'срок аренды' : s.flow}</p>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function JourneyLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-500">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> быстро</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> нормально</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> медленно</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> аренда — не зависит от водителя</span>
    </div>
  );
}
