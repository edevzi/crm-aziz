import React from 'react';
import { CheckCircle2, Truck, PackagePlus, Recycle, Flag } from 'lucide-react';
import { formatDuration, type OrderTimeline } from '@/lib/driver-stats-compute';
import { trackerSegments, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const ICON: Record<StageKey, any> = { approve: CheckCircle2, start: Truck, place: PackagePlus, pickup: Recycle, complete: Flag };

const BAR: Record<Quality, string> = { good: 'bg-emerald-400', ok: 'bg-amber-400', slow: 'bg-rose-500', neutral: 'bg-zinc-200' };
const NODE: Record<Quality, string> = {
  good: 'bg-emerald-500 text-white',
  ok: 'bg-amber-500 text-white',
  slow: 'bg-rose-500 text-white',
  neutral: 'bg-zinc-100 text-zinc-400',
};
const PILL: Record<Quality, string> = {
  good: 'text-emerald-700 bg-emerald-50',
  ok: 'text-amber-700 bg-amber-50',
  slow: 'text-white bg-rose-500',
  neutral: 'text-zinc-500 bg-zinc-100',
};

// Diagonal hatch marks the rental dwell — "not the driver's clock".
const HATCH: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(161,161,170,0.30), rgba(161,161,170,0.30) 3px, transparent 3px, transparent 7px)',
};

// Segment width ∝ duration so the bottleneck is literally the widest segment.
// Dwell is capped so a multi-hour rental never dominates the bar.
function weight(s: { durationSec: number | null; controllable: boolean; reached: boolean }): number {
  if (!s.reached || s.durationSec == null) return 0.6;
  if (!s.controllable) return 1.5;
  return Math.max(0.7, Math.min(7, s.durationSec / 600)); // 10 min ≈ 1 unit, capped
}

/**
 * Horizontal order-flow tracker (ride/delivery-progress style). Each stage is a
 * proportional segment: duration pill on top, colored bar (quality), stage node,
 * label. The breaching segment is red, thicker and widest — impossible to miss.
 */
export function StatusTracker({ timeline }: { timeline: OrderTimeline }) {
  const segs = trackerSegments(timeline);
  return (
    <div className="flex items-stretch gap-1.5">
      {segs.map((s) => {
        const Icon = ICON[s.key];
        const breach = s.quality === 'slow';
        return (
          <div
            key={s.key}
            className="flex flex-col items-center"
            style={{ flexGrow: weight(s), flexBasis: 0, minWidth: 42 }}
            title={`${s.title}: ${formatDuration(s.durationSec)}`}
          >
            <div className="h-5 flex items-end">
              {s.durationSec != null ? (
                <span className={`text-[10px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-full whitespace-nowrap ${PILL[s.quality]}`}>
                  {breach ? '⚠ ' : ''}
                  {formatDuration(s.durationSec)}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-300 font-bold">—</span>
              )}
            </div>
            <div className="w-full mt-1.5 px-0.5">
              <div
                className={`rounded-full ${breach ? 'h-2.5' : 'h-2'} ${s.reached ? BAR[s.quality] : 'bg-zinc-200'}`}
                style={!s.controllable && s.reached ? HATCH : undefined}
              />
            </div>
            <div
              className={`mt-2 h-7 w-7 rounded-full flex items-center justify-center ${
                s.reached ? NODE[s.quality] : 'bg-white text-zinc-300 border border-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="mt-1 text-[9px] font-semibold text-zinc-500 text-center leading-tight truncate w-full">{s.title}</span>
          </div>
        );
      })}
    </div>
  );
}
