// Pure (database-free) computation helpers for driver activity statistics.
// Kept separate from driver-stats.ts so the duration math is unit-testable in isolation.

export interface StageDurations {
  approve: number | null; // baseline (viewed||created) -> assigned
  start: number | null; // assigned -> in_progress
  place: number | null; // in_progress -> container_placed
  pickup: number | null; // (container_placed||in_progress) -> picked_up
  complete: number | null; // (picked_up||container_placed||in_progress) -> completed
  total: number | null; // baseline -> completed
}

/**
 * Honest signal about how trustworthy an order's timeline is. A missing core
 * event silently inflates the *next* stage (its duration absorbs the gap), so we
 * surface it instead of hiding it behind a confident-looking number.
 */
export interface DataQuality {
  missingEvents: string[]; // core lifecycle events absent within the elapsed span
  outOfOrder: boolean; // timestamps not monotonic along the lifecycle
}

export interface OrderTimeline {
  orderId: number;
  driverId: number | null;
  status: string;
  address: string | null;
  clientName: string | null;
  scheduledAt: Date | null;
  createdAt: Date | null;
  viewedAt: Date | null;
  assignedAt: Date | null;
  inProgressAt: Date | null;
  containerPlacedAt: Date | null;
  pickedUpAt: Date | null;
  completedAt: Date | null;
  durations: StageDurations;
  dataQuality: DataQuality;
}

/** Aggregate stats for one stage across many orders. `n` is the *real* sample size
 *  (orders that actually had data for this stage), not the cohort size. */
export interface StageStat {
  median: number | null;
  mean: number | null;
  p90: number | null;
  n: number;
  min: number | null;
  max: number | null;
}

export type StageStats = Record<keyof StageDurations, StageStat>;

export interface DriverStat {
  driverId: number;
  name: string;
  vehiclePlate: string;
  orderCount: number;
  completedCount: number;
  avg: StageDurations;
}

export interface OrderTimelineBase {
  orderId: number;
  driverId: number | null;
  status: string;
  address: string | null;
  clientName: string | null;
  scheduledAt: Date | null;
}

export const toDate = (v: any): Date | null => (v == null ? null : v instanceof Date ? v : new Date(v));

export function diffSec(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  const d = (a.getTime() - b.getTime()) / 1000;
  return d >= 0 ? Math.round(d) : null;
}

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n != null);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// The canonical order lifecycle, earliest → latest.
const LIFECYCLE_ORDER = [
  'created',
  'viewed',
  'assigned',
  'in_progress',
  'container_placed',
  'picked_up',
  'completed',
] as const;

// Events we expect to be logged by the time later events have happened. `created`
// is automatic and `viewed` is optional (a driver can accept from a push without
// opening the list), so neither counts as "missing".
const CORE_EVENTS = ['assigned', 'in_progress', 'container_placed', 'picked_up', 'completed'] as const;

/** Detects missing core events (within the span that has already elapsed) and non-monotonic timestamps. */
function computeDataQuality(first: Record<string, Date>): DataQuality {
  const presentIdx = LIFECYCLE_ORDER.map((e, i) => (first[e] ? i : -1)).filter((i) => i >= 0);
  const lastIdx = presentIdx.length ? Math.max(...presentIdx) : -1;

  const missingEvents = CORE_EVENTS.filter((e) => {
    const idx = LIFECYCLE_ORDER.indexOf(e);
    return idx <= lastIdx && !first[e]; // expected by now, but absent
  });

  let outOfOrder = false;
  let prev = -Infinity;
  for (const e of LIFECYCLE_ORDER) {
    const t = first[e];
    if (!t) continue;
    const ms = t.getTime();
    if (ms < prev) {
      outOfOrder = true;
      break;
    }
    prev = ms;
  }

  return { missingEvents, outOfOrder };
}

/** Builds an order timeline from its raw events (taking the first occurrence of each). */
export function buildTimeline(base: OrderTimelineBase, events: { event: string; at: Date | string }[]): OrderTimeline {
  const first: Record<string, Date> = {};
  for (const e of events) {
    const t = toDate(e.at);
    if (!t) continue;
    if (!first[e.event] || t < first[e.event]) first[e.event] = t;
  }

  const createdAt = first['created'] ?? null;
  const viewedAt = first['viewed'] ?? null;
  const assignedAt = first['assigned'] ?? null;
  const inProgressAt = first['in_progress'] ?? null;
  const containerPlacedAt = first['container_placed'] ?? null;
  const pickedUpAt = first['picked_up'] ?? null;
  const completedAt = first['completed'] ?? null;
  const baseline = viewedAt ?? createdAt;

  const durations: StageDurations = {
    approve: diffSec(assignedAt, baseline),
    start: diffSec(inProgressAt, assignedAt),
    place: diffSec(containerPlacedAt, inProgressAt),
    pickup: diffSec(pickedUpAt, containerPlacedAt ?? inProgressAt),
    complete: diffSec(completedAt, pickedUpAt ?? containerPlacedAt ?? inProgressAt),
    total: diffSec(completedAt, baseline),
  };

  return {
    orderId: base.orderId,
    driverId: base.driverId,
    status: base.status,
    address: base.address,
    clientName: base.clientName,
    scheduledAt: base.scheduledAt,
    createdAt,
    viewedAt,
    assignedAt,
    inProgressAt,
    containerPlacedAt,
    pickedUpAt,
    completedAt,
    durations,
    dataQuality: computeDataQuality(first),
  };
}

export function averageDurations(timelines: OrderTimeline[]): StageDurations {
  return {
    approve: avg(timelines.map((t) => t.durations.approve)),
    start: avg(timelines.map((t) => t.durations.start)),
    place: avg(timelines.map((t) => t.durations.place)),
    pickup: avg(timelines.map((t) => t.durations.pickup)),
    complete: avg(timelines.map((t) => t.durations.complete)),
    total: avg(timelines.map((t) => t.durations.total)),
  };
}

/** Linear-interpolated quantile over an ascending-sorted array. */
function quantile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return Math.round(sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo));
}

function statFor(values: (number | null)[]): StageStat {
  const vals = values.filter((v): v is number => v != null).sort((a, b) => a - b);
  const n = vals.length;
  if (n === 0) return { median: null, mean: null, p90: null, n: 0, min: null, max: null };
  return {
    median: quantile(vals, 0.5),
    mean: Math.round(vals.reduce((a, b) => a + b, 0) / n),
    p90: quantile(vals, 0.9),
    n,
    min: vals[0],
    max: vals[n - 1],
  };
}

/**
 * Per-stage distribution (median/mean/p90/min/max + real n). Median is the headline
 * because a single multi-day rental drags the mean — and each stage reports its own
 * `n`, so the UI can stop claiming "по N заказам" when a stage has fewer samples.
 */
export function stageStats(timelines: OrderTimeline[]): StageStats {
  const keys: (keyof StageDurations)[] = ['approve', 'start', 'place', 'pickup', 'complete', 'total'];
  const out = {} as StageStats;
  for (const k of keys) out[k] = statFor(timelines.map((t) => t.durations[k]));
  return out;
}

/** Formats a duration (seconds) into a compact ru-RU label, e.g. "12 мин", "1 ч 5 мин", "2 д 3 ч". */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds} сек`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} мин`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  if (hours < 24) return remMin ? `${hours} ч ${remMin} мин` : `${hours} ч`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days} д ${remHours} ч` : `${days} д`;
}
