import { db } from './db';
import { expenses, gasStationInbounds, users, drivers } from './schema';
import { inArray, desc } from 'drizzle-orm';

// 2 тонны солярки ≈ 2000 литров. Хранится централизованно: меняешь здесь — меняется везде.
export const BASE_TANK_CAPACITY_L = 2000;

export interface TankSummary {
  capacityL: number;
  currentL: number;
  totalInboundL: number;
  totalOutboundL: number;
  /** 0..1 — доля заполнения */
  fillFrac: number;
  /** Качественная оценка: ok / low / empty. Used to colour the tank. */
  level: 'ok' | 'low' | 'empty';
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
}

export interface TankDayPoint {
  date: string; // yyyy-mm-dd
  label: string; // dd.mm
  inboundL: number;
  outboundL: number;
  /** Остаток на конец дня — пересчитан кумулятивно. */
  endOfDayL: number;
}

export interface TankMovement {
  id: string; // `in-${id}` | `out-${expenseId}`
  type: 'inbound' | 'outbound';
  liters: number;
  note: string | null;
  driverName?: string | null;
  operatorName?: string | null;
  recordedAt: Date;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Quick summary card for the base diesel tank. */
export async function getBaseTankSummary(): Promise<TankSummary> {
  const [inbounds, outbounds] = await Promise.all([
    db.select({ liters: gasStationInbounds.liters, recordedAt: gasStationInbounds.recordedAt }).from(gasStationInbounds),
    db
      .select({ liters: expenses.liters, recordedAt: expenses.recordedAt })
      .from(expenses)
      .where(inArray(expenses.category, ['fuel', 'diesel'])),
  ]);

  const totalInboundL = inbounds.reduce((a, b) => a + (b.liters || 0), 0);
  const totalOutboundL = outbounds.reduce((a, b) => a + (b.liters || 0), 0);
  const currentL = Math.max(0, totalInboundL - totalOutboundL);
  const fillFrac = Math.min(1, Math.max(0, currentL / BASE_TANK_CAPACITY_L));

  const level: TankSummary['level'] = fillFrac <= 0.05 ? 'empty' : fillFrac < 0.25 ? 'low' : 'ok';

  const lastInboundAt = inbounds.reduce<Date | null>((acc, r) => {
    const t = r.recordedAt as Date | null;
    if (!t) return acc;
    return acc && acc > t ? acc : t;
  }, null);
  const lastOutboundAt = outbounds.reduce<Date | null>((acc, r) => {
    const t = r.recordedAt as Date | null;
    if (!t) return acc;
    return acc && acc > t ? acc : t;
  }, null);

  return {
    capacityL: BASE_TANK_CAPACITY_L,
    currentL,
    totalInboundL,
    totalOutboundL,
    fillFrac,
    level,
    lastInboundAt,
    lastOutboundAt,
  };
}

/** Day-by-day history: in / out / end-of-day balance over [from, to]. */
export async function getTankDailyHistory(from: Date, to: Date): Promise<TankDayPoint[]> {
  // Pull every movement so we can compute a cumulative "end-of-day" — including
  // movements BEFORE `from`, which form the opening balance.
  const [inbounds, outbounds] = await Promise.all([
    db.select({ liters: gasStationInbounds.liters, recordedAt: gasStationInbounds.recordedAt }).from(gasStationInbounds),
    db
      .select({ liters: expenses.liters, recordedAt: expenses.recordedAt })
      .from(expenses)
      .where(inArray(expenses.category, ['fuel', 'diesel'])),
  ]);

  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;

  // Opening balance = everything strictly before `start`.
  let runningL = 0;
  for (const r of inbounds) {
    const t = (r.recordedAt as Date)?.getTime?.() ?? 0;
    if (t < start) runningL += r.liters || 0;
  }
  for (const r of outbounds) {
    const t = (r.recordedAt as Date)?.getTime?.() ?? 0;
    if (t < start) runningL -= r.liters || 0;
  }

  // Per-day in/out within the window.
  const inByDay = new Map<string, number>();
  const outByDay = new Map<string, number>();
  for (const r of inbounds) {
    const t = (r.recordedAt as Date)?.getTime?.() ?? 0;
    if (t < start || t > end + day - 1) continue;
    const k = dayKey(new Date(t));
    inByDay.set(k, (inByDay.get(k) ?? 0) + (r.liters || 0));
  }
  for (const r of outbounds) {
    const t = (r.recordedAt as Date)?.getTime?.() ?? 0;
    if (t < start || t > end + day - 1) continue;
    const k = dayKey(new Date(t));
    outByDay.set(k, (outByDay.get(k) ?? 0) + (r.liters || 0));
  }

  const out: TankDayPoint[] = [];
  for (let t = start; t <= end; t += day) {
    const d = new Date(t);
    const k = dayKey(d);
    const inboundL = inByDay.get(k) ?? 0;
    const outboundL = outByDay.get(k) ?? 0;
    runningL += inboundL - outboundL;
    out.push({
      date: k,
      label: dayLabel(d),
      inboundL,
      outboundL,
      endOfDayL: Math.max(0, runningL),
    });
  }
  return out;
}

/** Most-recent inbound + outbound movements, merged and sorted by time. */
export async function getRecentTankMovements(limit = 20): Promise<TankMovement[]> {
  const [inboundRows, outboundRows] = await Promise.all([
    db
      .select({
        id: gasStationInbounds.id,
        liters: gasStationInbounds.liters,
        note: gasStationInbounds.note,
        recordedAt: gasStationInbounds.recordedAt,
        operatorName: users.name,
      })
      .from(gasStationInbounds)
      .leftJoin(users, eq(gasStationInbounds.operatorId, users.id))
      .orderBy(desc(gasStationInbounds.recordedAt))
      .limit(limit),
    db
      .select({
        id: expenses.id,
        liters: expenses.liters,
        note: expenses.note,
        recordedAt: expenses.recordedAt,
        driverName: drivers.name,
        operatorName: users.name,
      })
      .from(expenses)
      .leftJoin(drivers, eq(expenses.driverId, drivers.id))
      .leftJoin(users, eq(expenses.operatorId, users.id))
      .where(inArray(expenses.category, ['fuel', 'diesel']))
      .orderBy(desc(expenses.recordedAt))
      .limit(limit),
  ]);

  const merged: TankMovement[] = [
    ...inboundRows.map((r) => ({
      id: `in-${r.id}`,
      type: 'inbound' as const,
      liters: r.liters || 0,
      note: r.note,
      operatorName: r.operatorName,
      recordedAt: r.recordedAt as Date,
    })),
    ...outboundRows
      .filter((r) => (r.liters ?? 0) > 0)
      .map((r) => ({
        id: `out-${r.id}`,
        type: 'outbound' as const,
        liters: r.liters || 0,
        note: r.note,
        driverName: r.driverName,
        operatorName: r.operatorName,
        recordedAt: r.recordedAt as Date,
      })),
  ];

  return merged
    .sort((a, b) => (b.recordedAt?.getTime?.() ?? 0) - (a.recordedAt?.getTime?.() ?? 0))
    .slice(0, limit);
}

// drizzle's eq lives in 'drizzle-orm' — re-import lazily so this module stays tree-shake friendly.
import { eq } from 'drizzle-orm';
