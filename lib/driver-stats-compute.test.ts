import { describe, it, expect } from 'vitest';
import { buildTimeline, averageDurations, formatDuration, type OrderTimelineBase } from './driver-stats-compute';

const base: OrderTimelineBase = {
  orderId: 1,
  driverId: 7,
  status: 'completed',
  address: 'Test',
  clientName: 'Client',
  scheduledAt: new Date('2026-05-31T12:00:00Z'),
};

const D = (s: string) => new Date(`2026-05-31T${s}Z`);

describe('formatDuration', () => {
  it('formats edge cases', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(30)).toBe('30 сек');
    expect(formatDuration(90)).toBe('1 мин');
    expect(formatDuration(600)).toBe('10 мин');
    expect(formatDuration(3600)).toBe('1 ч');
    expect(formatDuration(3900)).toBe('1 ч 5 мин');
    expect(formatDuration(90000)).toBe('1 д 1 ч'); // 25h
  });
});

describe('buildTimeline — full sequence', () => {
  const t = buildTimeline(base, [
    { event: 'created', at: D('10:00:00') },
    { event: 'viewed', at: D('10:05:00') },
    { event: 'assigned', at: D('10:08:00') },
    { event: 'in_progress', at: D('10:18:00') },
    { event: 'container_placed', at: D('10:48:00') },
    { event: 'picked_up', at: D('11:18:00') },
    { event: 'completed', at: D('11:20:00') },
  ]);

  it('computes each stage duration from the viewed baseline', () => {
    expect(t.durations.approve).toBe(180); // viewed -> assigned (3 min)
    expect(t.durations.start).toBe(600); // assigned -> in_progress (10 min)
    expect(t.durations.place).toBe(1800); // in_progress -> container_placed (30 min)
    expect(t.durations.pickup).toBe(1800); // container_placed -> picked_up (30 min)
    expect(t.durations.complete).toBe(120); // picked_up -> completed (2 min)
    expect(t.durations.total).toBe(4500); // viewed -> completed (75 min)
  });
});

describe('buildTimeline — skip case (no container_placed)', () => {
  const t = buildTimeline(base, [
    { event: 'created', at: D('10:00:00') },
    { event: 'viewed', at: D('10:05:00') },
    { event: 'assigned', at: D('10:08:00') },
    { event: 'in_progress', at: D('10:18:00') },
    { event: 'picked_up', at: D('10:38:00') },
    { event: 'completed', at: D('10:40:00') },
  ]);

  it('falls back to in_progress for pickup and skips place', () => {
    expect(t.durations.place).toBeNull(); // no container_placed
    expect(t.durations.pickup).toBe(1200); // in_progress -> picked_up (20 min)
    expect(t.durations.complete).toBe(120); // picked_up -> completed
  });
});

describe('buildTimeline — viewed missing', () => {
  const t = buildTimeline(base, [
    { event: 'created', at: D('10:00:00') },
    { event: 'assigned', at: D('10:10:00') },
  ]);

  it('uses created as the baseline for approve', () => {
    expect(t.viewedAt).toBeNull();
    expect(t.durations.approve).toBe(600); // created -> assigned (10 min)
  });
});

describe('buildTimeline — out-of-order guard', () => {
  const t = buildTimeline(base, [
    { event: 'viewed', at: D('10:10:00') },
    { event: 'assigned', at: D('10:05:00') }, // before viewed
  ]);

  it('returns null for negative durations', () => {
    expect(t.durations.approve).toBeNull();
  });
});

describe('averageDurations', () => {
  it('averages non-null values and ignores nulls', () => {
    const a = buildTimeline(base, [
      { event: 'viewed', at: D('10:00:00') },
      { event: 'assigned', at: D('10:02:00') }, // approve 120
    ]);
    const b = buildTimeline(base, [
      { event: 'viewed', at: D('10:00:00') },
      { event: 'assigned', at: D('10:06:00') }, // approve 360
    ]);
    const c = buildTimeline(base, [{ event: 'created', at: D('10:00:00') }]); // approve null

    const avg = averageDurations([a, b, c]);
    expect(avg.approve).toBe(240); // (120 + 360) / 2
    expect(avg.total).toBeNull(); // none completed
  });
});
