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

const BAR_COLOR: Record<Quality, string> = {
  good: 'bg-emerald-500',
  ok: 'bg-amber-500',
  slow: 'bg-rose-500',
  neutral: 'bg-slate-300',
};

const ICON_BG: Record<StageKey, string> = {
  approve: 'bg-violet-100 text-violet-700',
  start: 'bg-sky-100 text-sky-700',
  place: 'bg-teal-100 text-teal-700',
  pickup: 'bg-slate-100 text-slate-500',
  complete: 'bg-emerald-100 text-emerald-700',
};

/**
 * Horizontal bar chart of stage durations. Bar length is normalised against the
 * longest stage in the row, so the eye instantly picks out the biggest time sink.
 * No paragraph explanation — the bars do the talking.
 */
export function JourneyBars({ durations }: { durations: StageDurations }) {
  const max = Math.max(
    1,
    ...STAGES.map((s) => durations[s.key] ?? 0),
  );

  return (
    <ul className="space-y-3">
      {STAGES.map((s) => {
        const Icon = ICONS[s.key];
        const seconds = durations[s.key];
        const q = stageQuality(s.key, seconds);
        const widthPct = seconds == null ? 0 : Math.max(2, (seconds / max) * 100);

        return (
          <li key={s.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[s.key]}`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800 truncate">{s.title}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLOR[q]} transition-[width] duration-500`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-extrabold text-slate-800 tabular-nums whitespace-nowrap text-right min-w-[68px]">
              {formatDuration(seconds)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
