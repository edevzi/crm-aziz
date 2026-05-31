import { db } from './db';
import { orders, drivers, clients, orderEvents } from './schema';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import {
  buildTimeline,
  averageDurations,
  toDate,
  type OrderTimeline,
  type DriverStat,
} from './driver-stats-compute';

// Re-export the pure helpers/types so existing call sites keep importing from '@/lib/driver-stats'.
export { averageDurations, formatDuration } from './driver-stats-compute';
export type { StageDurations, OrderTimeline, DriverStat } from './driver-stats-compute';

export interface DriverStatsOverview {
  drivers: DriverStat[];
  global: {
    driverCount: number;
    orderCount: number;
    completedCount: number;
    avg: ReturnType<typeof averageDurations>;
  };
}

function scheduledRangeConditions(from?: string, to?: string) {
  const conds = [];
  if (from) {
    conds.push(sql`${orders.scheduledAt} >= ${new Date(from).toISOString()}`);
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conds.push(sql`${orders.scheduledAt} <= ${end.toISOString()}`);
  }
  return conds;
}

/** Aggregate activity stats for every driver (+ global averages) in the given period. */
export async function getDriverStatsOverview(from?: string, to?: string): Promise<DriverStatsOverview> {
  const conditions = [isNotNull(orders.driverId), ...scheduledRangeConditions(from, to)];

  const rows = await db
    .select({
      orderId: orderEvents.orderId,
      driverId: orders.driverId,
      event: orderEvents.event,
      at: orderEvents.createdAt,
      status: orders.status,
      scheduledAt: orders.scheduledAt,
    })
    .from(orderEvents)
    .innerJoin(orders, eq(orderEvents.orderId, orders.id))
    .where(and(...conditions));

  const allDrivers = await db.select().from(drivers).orderBy(drivers.name);

  const byOrder = new Map<number, { base: any; events: { event: string; at: Date }[] }>();
  for (const r of rows) {
    let entry = byOrder.get(r.orderId);
    if (!entry) {
      entry = {
        base: { orderId: r.orderId, driverId: r.driverId, status: r.status, address: null, clientName: null, scheduledAt: toDate(r.scheduledAt) },
        events: [],
      };
      byOrder.set(r.orderId, entry);
    }
    entry.events.push({ event: r.event, at: r.at as Date });
  }

  const timelines: OrderTimeline[] = Array.from(byOrder.values()).map((e) => buildTimeline(e.base, e.events));

  const byDriver = new Map<number, OrderTimeline[]>();
  for (const t of timelines) {
    if (t.driverId == null) continue;
    const list = byDriver.get(t.driverId) ?? [];
    list.push(t);
    byDriver.set(t.driverId, list);
  }

  const driverStats: DriverStat[] = allDrivers
    .map((d) => {
      const list = byDriver.get(d.id) ?? [];
      return {
        driverId: d.id,
        name: d.name,
        vehiclePlate: d.vehiclePlate,
        orderCount: list.length,
        completedCount: list.filter((t) => t.completedAt != null).length,
        avg: averageDurations(list),
      };
    })
    .filter((d) => d.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount);

  return {
    drivers: driverStats,
    global: {
      driverCount: driverStats.length,
      orderCount: timelines.length,
      completedCount: timelines.filter((t) => t.completedAt != null).length,
      avg: averageDurations(timelines),
    },
  };
}

/** Per-order activity timeline for a single driver in the given period (newest first). */
export async function getDriverActivity(driverId: number, from?: string, to?: string): Promise<OrderTimeline[]> {
  const conditions = [eq(orders.driverId, driverId), ...scheduledRangeConditions(from, to)];

  const rows = await db
    .select({
      orderId: orderEvents.orderId,
      driverId: orders.driverId,
      event: orderEvents.event,
      at: orderEvents.createdAt,
      status: orders.status,
      address: orders.address,
      clientName: clients.name,
      scheduledAt: orders.scheduledAt,
    })
    .from(orderEvents)
    .innerJoin(orders, eq(orderEvents.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(...conditions));

  const byOrder = new Map<number, { base: any; events: { event: string; at: Date }[] }>();
  for (const r of rows) {
    let entry = byOrder.get(r.orderId);
    if (!entry) {
      entry = {
        base: {
          orderId: r.orderId,
          driverId: r.driverId,
          status: r.status,
          address: r.address,
          clientName: r.clientName,
          scheduledAt: toDate(r.scheduledAt),
        },
        events: [],
      };
      byOrder.set(r.orderId, entry);
    }
    entry.events.push({ event: r.event, at: r.at as Date });
  }

  return Array.from(byOrder.values())
    .map((e) => buildTimeline(e.base, e.events))
    .sort((a, b) => {
      const ta = (a.scheduledAt ?? a.createdAt)?.getTime() ?? 0;
      const tb = (b.scheduledAt ?? b.createdAt)?.getTime() ?? 0;
      return tb - ta;
    });
}
