import { db } from './db';
import { orders, drivers, clients, orderEvents } from './schema';
import { isNotNull, eq, inArray } from 'drizzle-orm';

// Rich demo data for the per-driver analytics dashboard. Creates many orders per
// driver across the last 30 days with DISTINCT per-driver speed (fast → slow),
// some SLA breaches and some card-flow "missing step" cases — so the analytics
// show real variation. Idempotent: removes its own prior demo orders + all events.

const MARKER = 'demo-driver-stats';
const rand = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const chance = (p: number) => Math.random() < p;

const ADDRESSES = [
  'ул. Навои 12', 'пр. Амира Темура 45', 'ул. Бабура 8', 'мкр. Юнусабад 4-7',
  'ул. Шота Руставели 21', 'пр. Мустакиллик 90', 'ул. Фароби 33', 'мкр. Чиланзар 19-2',
  'ул. Кораташ 5', 'ул. Сайрам 17', 'пр. Бунёдкор 56', 'ул. Тинчлик 3',
];
const CLIENT_SEED = [
  ['ООО «Тепло»', '+998901112233', 'ул. Навои 12'],
  ['Магазин «Корзинка»', '+998901112244', 'пр. Амира Темура 45'],
  ['Кафе «Плов Центр»', '+998901112255', 'ул. Бабура 8'],
  ['ЖК «Бунёдкор»', '+998901112266', 'пр. Бунёдкор 56'],
  ['Стройбаза №3', '+998901112277', 'ул. Кораташ 5'],
];

const STATUS_DEPTH: Record<string, number> = {
  new: 1, assigned: 2, in_progress: 3, container_placed: 4, picked_up: 5, completed: 6,
};

async function main() {
  const driverRows = await db.select().from(drivers).orderBy(drivers.id);
  if (!driverRows.length) {
    console.log('No drivers found — seed drivers first.');
    process.exit(0);
  }

  // Ensure we have a few clients to attach orders to.
  let clientRows = await db.select().from(clients);
  if (clientRows.length < 3) {
    await db.insert(clients).values(CLIENT_SEED.map(([name, phone, address]) => ({ name, phone, address })));
    clientRows = await db.select().from(clients);
  }

  // Remove prior demo orders (+ their events), then clear ALL events (demo-only table)
  // so existing real orders and the new demo orders get one consistent timeline set.
  const prior = await db.select({ id: orders.id }).from(orders).where(eq(orders.operatorNote, MARKER));
  const priorIds = prior.map((p) => p.id);
  if (priorIds.length) {
    await db.delete(orderEvents).where(inArray(orderEvents.orderId, priorIds));
    await db.delete(orders).where(inArray(orders.id, priorIds));
  }
  await db.delete(orderEvents);

  // Distinct speed factor per driver by rank: fastest → slowest (cycles if >4 drivers).
  const FACTORS = [0.6, 0.95, 1.35, 1.9];
  const driverFactor = new Map<number, number>();
  driverRows.forEach((d, i) => driverFactor.set(d.id, FACTORS[i % FACTORS.length]));

  const SIZES = [8, 12, 20, 27];
  const RENTALS = ['1_day', '1_week', '1_month'];
  const PAYMENTS = ['cash', 'card', 'online'] as const;
  const now = Date.now();
  const day = 86400000;

  // ---- Build varied orders (≈60% in the last 7 days so the default view is rich) ----
  const newOrders: any[] = [];
  for (const d of driverRows) {
    const count = rand(11, 16);
    for (let k = 0; k < count; k++) {
      const daysAgo = chance(0.6) ? rand(0, 6) : rand(7, 29);
      const scheduledAt = new Date(now - daysAgo * day);
      scheduledAt.setHours(rand(8, 19), rand(0, 59), 0, 0);
      const roll = Math.random();
      const status =
        roll < 0.78 ? 'completed' : roll < 0.86 ? 'picked_up' : roll < 0.92 ? 'in_progress' : roll < 0.97 ? 'container_placed' : 'assigned';
      newOrders.push({
        clientId: pick(clientRows).id,
        driverId: d.id,
        operatorNote: MARKER,
        address: pick(ADDRESSES),
        scheduledAt,
        containerSizeM3: pick(SIZES),
        rentalDuration: pick(RENTALS),
        status,
        paymentAmount: rand(8, 30) * 100000,
        paymentType: pick(PAYMENTS as unknown as string[]),
      });
    }
  }
  await db.insert(orders).values(newOrders);

  // ---- Seed realistic timelines for EVERY driver-assigned order ----
  const allDriverOrders = await db.select().from(orders).where(isNotNull(orders.driverId));
  const events: { orderId: number; driverId: number | null; event: string; actor: string; createdAt: Date }[] = [];

  for (const o of allDriverOrders) {
    const factor = driverFactor.get(o.driverId!) ?? 1;
    const depth = STATUS_DEPTH[o.status] ?? 1;
    const g = (min: number, max: number) => Math.max(1, Math.round(rand(min, max) * factor)); // minutes

    const cardFlow = o.paymentType === 'card' || o.paymentType === 'online';
    const skipPlace = depth >= 5 && cardFlow && chance(0.5); // card flow sometimes skips "container_placed"
    const slowDepart = chance(0.18); // ~18% have a slow departure (some breach the SLA)

    const seq: { event: string; gap: number }[] = [{ event: 'created', gap: 0 }];
    seq.push({ event: 'viewed', gap: g(1, 40) });
    if (depth >= 2) seq.push({ event: 'assigned', gap: g(1, 18) });
    if (depth >= 3) seq.push({ event: 'in_progress', gap: slowDepart ? g(110, 230) : g(8, 40) });
    if (depth >= 4 && !skipPlace) seq.push({ event: 'container_placed', gap: g(10, 55) });
    if (depth >= 5) seq.push({ event: 'picked_up', gap: g(120, 900) }); // rental dwell (hours)
    if (depth >= 6) seq.push({ event: 'completed', gap: g(2, 12) });

    let t = new Date(o.scheduledAt).getTime() - rand(20, 90) * 60000; // begin a bit before scheduled
    for (const s of seq) {
      t += s.gap * 60 * 1000;
      events.push({
        orderId: o.id,
        driverId: o.driverId,
        event: s.event,
        actor: s.event === 'created' ? 'operator' : 'driver',
        createdAt: new Date(t),
      });
    }
  }

  const CHUNK = 200;
  for (let i = 0; i < events.length; i += CHUNK) {
    await db.insert(orderEvents).values(events.slice(i, i + CHUNK));
  }

  const perDriver = driverRows
    .map((d) => `${d.name}=${allDriverOrders.filter((o) => o.driverId === d.id).length}`)
    .join(', ');
  console.log(`Seeded ${newOrders.length} demo orders, ${events.length} events across ${allDriverOrders.length} orders.`);
  console.log(`Orders per driver: ${perDriver}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
