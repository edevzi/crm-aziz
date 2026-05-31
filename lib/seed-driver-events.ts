import { db } from './db';
import { orders, drivers, orderEvents } from './schema';
import { isNotNull, desc } from 'drizzle-orm';

// Seeds demo driver-activity events into the (otherwise empty) order_events table so the
// /driver-stats dashboard has something to show. Attaches realistic, varied timelines to
// EXISTING orders that already have a driver. Re-runnable: clears order_events first.

const rand = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));
const chance = (p: number) => Math.random() < p;

async function main() {
  console.log('Clearing existing order_events (demo-only table)...');
  await db.delete(orderEvents);

  const driverRows = await db.select().from(drivers);
  // Give each driver a consistent "speed factor" so the leaderboard has fast/slow drivers.
  const driverFactor = new Map<number, number>();
  for (const d of driverRows) driverFactor.set(d.id, 0.7 + (d.id % 5) * 0.18);

  const recentOrders = await db
    .select()
    .from(orders)
    .where(isNotNull(orders.driverId))
    .orderBy(desc(orders.scheduledAt))
    .limit(60);

  if (recentOrders.length === 0) {
    console.log('No orders with an assigned driver found — nothing to seed.');
    process.exit(0);
  }

  const STATUS_DEPTH: Record<string, number> = {
    new: 1, assigned: 2, in_progress: 3, container_placed: 4, picked_up: 5, completed: 6,
  };

  const toInsert: { orderId: number; driverId: number | null; event: string; actor: string; createdAt: Date }[] = [];
  const perStatus: Record<string, number> = {};

  for (const o of recentOrders) {
    const factor = driverFactor.get(o.driverId!) ?? 1;
    const depth = STATUS_DEPTH[o.status] ?? 1;
    perStatus[o.status] = (perStatus[o.status] || 0) + 1;

    const g = (min: number, max: number) => Math.max(1, Math.round(rand(min, max) * factor)); // minutes
    const skipPlace = depth >= 5 && chance(0.25); // ~25% of advanced orders skip "container_placed" (cash flow)

    const seq: { event: string; gap: number }[] = [{ event: 'created', gap: 0 }];
    if (depth >= 2 || chance(0.75)) seq.push({ event: 'viewed', gap: g(1, 90) });
    if (depth >= 2) seq.push({ event: 'assigned', gap: g(1, 20) });
    if (depth >= 3) seq.push({ event: 'in_progress', gap: g(5, 45) });
    if (depth >= 4 && !skipPlace) seq.push({ event: 'container_placed', gap: g(8, 35) });
    if (depth >= 5) seq.push({ event: 'picked_up', gap: g(60, 600) });
    if (depth >= 6) seq.push({ event: 'completed', gap: g(1, 12) });

    let t = new Date(o.createdAt).getTime();
    for (const s of seq) {
      t += s.gap * 60 * 1000;
      toInsert.push({
        orderId: o.id,
        driverId: o.driverId,
        event: s.event,
        actor: s.event === 'created' ? 'operator' : 'driver',
        createdAt: new Date(t),
      });
    }
  }

  const CHUNK = 200;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await db.insert(orderEvents).values(toInsert.slice(i, i + CHUNK));
  }

  const dates = recentOrders.map((o) => new Date(o.scheduledAt).getTime());
  console.log(`Seeded ${toInsert.length} events across ${recentOrders.length} orders.`);
  console.log('Orders by status:', perStatus);
  console.log(
    'scheduledAt range:',
    new Date(Math.min(...dates)).toISOString().slice(0, 10),
    '→',
    new Date(Math.max(...dates)).toISOString().slice(0, 10),
  );
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
