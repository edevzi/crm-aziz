// Presentation metadata for driver statistics: plain-language labels, "good/ok/slow"
// thresholds and a simple verdict — so a non-technical user instantly understands the numbers.
import type { StageDurations, OrderTimeline } from './driver-stats-compute';

export type StageKey = 'approve' | 'start' | 'place' | 'pickup' | 'complete';
export type Quality = 'good' | 'ok' | 'slow' | 'neutral';

export interface StageMeta {
  key: StageKey;
  title: string; // short, plain label
  flow: string; // "from → to" in plain words
  good?: number; // <= good (sec) → fast (green)
  ok?: number; // <= ok (sec) → medium (amber); above → slow (red)
  neutral?: boolean; // not a driver-speed metric (e.g. rental period)
  controllable: boolean; // true = reflects driver speed; false = external (rental dwell)
}

// Ordered along the real order lifecycle.
export const STAGES: StageMeta[] = [
  { key: 'approve', title: 'Принял заказ', flow: 'увидел → принял', good: 10 * 60, ok: 30 * 60, controllable: true },
  { key: 'start', title: 'Выехал', flow: 'принял → выехал', good: 30 * 60, ok: 90 * 60, controllable: true },
  { key: 'place', title: 'Установил', flow: 'выехал → поставил', good: 60 * 60, ok: 120 * 60, controllable: true },
  { key: 'pickup', title: 'Забрал', flow: 'поставил → забрал', neutral: true, controllable: false }, // зависит от срока аренды
  { key: 'complete', title: 'Завершил', flow: 'забрал → завершил', good: 15 * 60, ok: 45 * 60, controllable: true },
];

export const STAGE_BY_KEY: Record<StageKey, StageMeta> = Object.fromEntries(
  STAGES.map((s) => [s.key, s]),
) as Record<StageKey, StageMeta>;

export function stageQuality(key: StageKey, seconds: number | null | undefined): Quality {
  const meta = STAGE_BY_KEY[key];
  if (!meta || meta.neutral || seconds == null) return 'neutral';
  if (meta.good != null && seconds <= meta.good) return 'good';
  if (meta.ok != null && seconds <= meta.ok) return 'ok';
  return 'slow';
}

export const QUALITY_LABEL: Record<Quality, string> = {
  good: 'Быстро',
  ok: 'Нормально',
  slow: 'Медленно',
  neutral: '',
};

export interface StageClassification {
  quality: Quality;
  controllable: boolean;
  breached: boolean; // a controllable stage that ran slower than its `ok` limit
  target: number | null; // `good` target (sec) — the goal
  limit: number | null; // `ok` upper bound (sec) — breaching this turns it red
}

/** One call gives the UI everything it needs: verdict, whether it's a real breach, and the thresholds. */
export function classifyStage(key: StageKey, seconds: number | null | undefined): StageClassification {
  const meta = STAGE_BY_KEY[key];
  const quality = stageQuality(key, seconds);
  const controllable = !!meta?.controllable;
  return {
    quality,
    controllable,
    breached: controllable && quality === 'slow',
    target: meta?.good ?? null,
    limit: meta?.ok ?? null,
  };
}

/** Overall driver speed = worst of the judged (non-rental) stages that have data. */
export function overallRating(d: StageDurations): Quality {
  const judged: StageKey[] = ['approve', 'start', 'place', 'complete'];
  const levels = judged
    .map((k) => stageQuality(k, d[k]))
    .filter((q) => q !== 'neutral') as Exclude<Quality, 'neutral'>[];
  if (levels.length === 0) return 'neutral';
  if (levels.includes('slow')) return 'slow';
  if (levels.includes('ok')) return 'ok';
  return 'good';
}

export const RATING_BADGE: Record<Quality, string> = {
  good: 'Быстрый водитель',
  ok: 'Средний темп',
  slow: 'Есть задержки',
  neutral: 'Мало данных',
};

// ---- Per-order step tracker (used by the horizontal StatusTracker) ----

export interface TrackerSegment {
  key: StageKey;
  title: string;
  durationSec: number | null;
  quality: Quality;
  controllable: boolean;
  unreliable: boolean; // computed off a fallback baseline (predecessor event missing)
  reached: boolean; // the destination event exists
}

// The event that must exist for a controllable stage's duration to be trustworthy.
const STAGE_PREDECESSOR: Partial<Record<StageKey, (t: OrderTimeline) => Date | null>> = {
  start: (t) => t.assignedAt,
  place: (t) => t.inProgressAt,
  complete: (t) => t.pickedUpAt,
};

function stageUnreliable(key: StageKey, t: OrderTimeline): boolean {
  const pred = STAGE_PREDECESSOR[key];
  return pred ? pred(t) == null : false;
}

const STAGE_REACHED: Record<StageKey, (t: OrderTimeline) => boolean> = {
  approve: (t) => t.assignedAt != null,
  start: (t) => t.inProgressAt != null,
  place: (t) => t.containerPlacedAt != null,
  pickup: (t) => t.pickedUpAt != null,
  complete: (t) => t.completedAt != null,
};

/** The 5 lifecycle segments for one order, ready for a horizontal step tracker. */
export function trackerSegments(t: OrderTimeline): TrackerSegment[] {
  return STAGES.map((s) => {
    const sec = t.durations[s.key];
    const unreliable = stageUnreliable(s.key, t);
    const quality: Quality = !s.controllable || unreliable ? 'neutral' : stageQuality(s.key, sec);
    return { key: s.key, title: s.title, durationSec: sec, quality, controllable: s.controllable, unreliable, reached: STAGE_REACHED[s.key](t) };
  });
}
