import React from 'react';
import { CheckCircle2, Truck, PackagePlus, Recycle, Flag } from 'lucide-react';
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

const ICON_BG: Record<StageKey, string> = {
  approve: 'bg-violet-100 text-violet-700',
  start: 'bg-sky-100 text-sky-700',
  place: 'bg-teal-100 text-teal-700',
  pickup: 'bg-slate-100 text-slate-500',
  complete: 'bg-emerald-100 text-emerald-700',
};

const TEXT_COLOR: Record<Quality, string> = {
  good: 'text-emerald-600',
  ok: 'text-amber-600',
  slow: 'text-rose-600',
  neutral: 'text-slate-700',
};

const QUALITY_DOT: Record<Quality, string> = {
  good: 'bg-emerald-500',
  ok: 'bg-amber-500',
  slow: 'bg-rose-500',
  neutral: 'bg-slate-300',
};

/**
 * Mean duration per lifecycle stage. Plain list, no bars — bars were confusing
 * users ("what is the bar comparing against?"). Colour of the number = quality.
 */
export function JourneyStages({
  durations,
  sampleCount,
}: {
  durations: StageDurations;
  sampleCount: number;
}) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 font-medium mb-3">
        В среднем на 1 заказ · по {sampleCount} {sampleCount === 1 ? 'заказу' : 'заказам'}
      </p>
      <ul className="rounded-xl bg-slate-50/40 ring-1 ring-slate-100 divide-y divide-slate-100/80">
        {STAGES.map((s) => {
          const Icon = ICONS[s.key];
          const seconds = durations[s.key];
          const q = stageQuality(s.key, seconds);
          return (
            <li key={s.key} className="flex items-center justify-between gap-3 py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[s.key]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{s.title}</p>
                  {s.neutral && (
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">срок аренды контейнера</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!s.neutral && seconds != null && (
                  <span className={`h-1.5 w-1.5 rounded-full ${QUALITY_DOT[q]}`} />
                )}
                <span className={`text-base sm:text-lg font-extrabold tabular-nums whitespace-nowrap ${TEXT_COLOR[q]}`}>
                  {formatDuration(seconds)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Back-compat alias (the page still imports the old name).
export { JourneyStages as JourneyBars };
