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
}

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
