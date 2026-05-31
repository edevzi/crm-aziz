import React from 'react';
import { CheckCircle2, Truck, PackagePlus, Recycle, Flag, AlertTriangle } from 'lucide-react';
import type { StageStats, StageStat } from '@/lib/driver-stats-compute';
import { formatDuration } from '@/lib/driver-stats-compute';
import { STAGES, classifyStage, type StageKey, type StageMeta, type Quality } from '@/lib/driver-stats-meta';

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
  pickup: 'bg-slate-100 text-slate-400',
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

// A faint diagonal hatch marks "not the driver's clock" so the rental dwell can
// never be mistaken for a performance bottleneck, however large the number is.
const HATCH: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(148,163,184,0.10), rgba(148,163,184,0.10) 5px, transparent 5px, transparent 11px)',
};

/** A driver-controlled stage: median value, real n, quality colour, and an SLA breach flag. */
function ControllableRow({ stage, stat }: { stage: StageMeta; stat: StageStat }) {
  const Icon = ICONS[stage.key];
  const seconds = stat.median; // median resists single-order outliers
  const { quality, breached, limit } = classifyStage(stage.key, seconds);

  return (
    <li className="flex items-center justify-between gap-3 py-2.5 px-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[stage.key]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight">{stage.title}</p>
          <p className="text-[11px] leading-tight mt-0.5 text-slate-400">
            {stat.n > 0 ? `медиана · n=${stat.n}` : 'нет данных'}
            {breached && limit != null && (
              <span className="text-rose-500 font-semibold"> · норма &lt; {formatDuration(limit)}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {breached && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
        {seconds != null && <span className={`h-1.5 w-1.5 rounded-full ${QUALITY_DOT[quality]}`} />}
        <span className={`text-base sm:text-lg font-extrabold tabular-nums whitespace-nowrap ${TEXT_COLOR[quality]}`}>
          {formatDuration(seconds)}
        </span>
      </div>
    </li>
  );
}

/** An external stage (rental dwell): muted, never colour-graded as driver speed. */
function ExternalRow({ stage, stat }: { stage: StageMeta; stat: StageStat }) {
  const Icon = ICONS[stage.key];
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 px-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[stage.key]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500 leading-tight">{stage.title}</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">срок аренды · не зависит от водителя</p>
        </div>
      </div>
      <span className="text-base sm:text-lg font-bold tabular-nums whitespace-nowrap text-slate-400 flex-shrink-0">
        {formatDuration(stat.median)}
      </span>
    </li>
  );
}

/**
 * Median duration per lifecycle stage, split into what the driver controls vs.
 * what they don't. The old single list rendered rental dwell ("Забрал · 5 ч") at
 * full weight next to in-SLA stages, so the biggest number on screen was the one
 * a manager should ignore. Here the dwell is segregated, muted and hatched, while
 * each controllable stage carries its real sample size and an SLA-breach flag.
 */
export function JourneyStages({ stats }: { stats: StageStats }) {
  const controllable = STAGES.filter((s) => s.controllable);
  const external = STAGES.filter((s) => !s.controllable);

  return (
    <div>
      <p className="text-[11px] text-slate-400 font-medium mb-3">Медиана времени на этап · n = заказов с данными</p>

      <ul className="rounded-xl bg-slate-50/40 ring-1 ring-slate-100 divide-y divide-slate-100/80">
        {controllable.map((s) => (
          <ControllableRow key={s.key} stage={s} stat={stats[s.key]} />
        ))}
      </ul>

      {external.length > 0 && (
        <>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-4 mb-2 flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-[3px] ring-1 ring-slate-200" style={HATCH} />
            Вне контроля водителя
          </p>
          <ul className="rounded-xl bg-slate-50/60 ring-1 ring-slate-100 divide-y divide-slate-100/80" style={HATCH}>
            {external.map((s) => (
              <ExternalRow key={s.key} stage={s} stat={stats[s.key]} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Back-compat alias (the pages still import the old name).
export { JourneyStages as JourneyBars };
