// Presentation metadata for driver statistics: plain-language labels, "good/ok/slow"
// thresholds and a simple verdict — so a non-technical user instantly understands the numbers.
import type { StageDurations } from './driver-stats-compute';

export type StageKey = 'approve' | 'start' | 'place' | 'pickup' | 'complete';
export type Quality = 'good' | 'ok' | 'slow' | 'neutral';

export interface StageMeta {
  key: StageKey;
  title: string; // short, plain label
  flow: string; // "from → to" in plain words
  good?: number; // <= good (sec) → fast (green)
  ok?: number; // <= ok (sec) → medium (amber); above → slow (red)
  neutral?: boolean; // not a driver-speed metric (e.g. rental period)
}

// Ordered along the real order lifecycle.
export const STAGES: StageMeta[] = [
  { key: 'approve', title: 'Принял заказ', flow: 'увидел → принял', good: 10 * 60, ok: 30 * 60 },
  { key: 'start', title: 'Выехал', flow: 'принял → выехал', good: 30 * 60, ok: 90 * 60 },
  { key: 'place', title: 'Установил', flow: 'выехал → поставил', good: 60 * 60, ok: 120 * 60 },
  { key: 'pickup', title: 'Забрал', flow: 'поставил → забрал', neutral: true }, // зависит от срока аренды
  { key: 'complete', title: 'Завершил', flow: 'забрал → завершил', good: 15 * 60, ok: 45 * 60 },
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
