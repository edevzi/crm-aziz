import { db } from './db';
import { gasStationInbounds, expenses, drivers } from './schema';
import { desc, inArray } from 'drizzle-orm';

// Seeds a realistic base-tank picture for demos:
//  – Several inbound refills over the last 14 days (operator brought fuel)
//  – Several outbound entries (drivers filled up from the tank) using expenses
//
// Idempotent-ish: skips inserts if a recent inbound with the same note marker
// already exists, so re-running doesn't double the demo data.

const MARKER = '[seed:base-tank]';

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function daysAgo(n: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const recent = await db
    .select({ note: gasStationInbounds.note })
    .from(gasStationInbounds)
    .orderBy(desc(gasStationInbounds.recordedAt))
    .limit(20);
  const alreadySeeded = recent.some((r) => (r.note ?? '').includes(MARKER));

  if (alreadySeeded) {
    console.log('Base tank seed already present — skipping.');
    process.exit(0);
  }

  // 4 refills spread across the last two weeks (operator brought fuel by truck)
  const refills: { days: number; liters: number; hour: number }[] = [
    { days: 13, liters: 1200, hour: 9 },
    { days: 10, liters: 800, hour: 11 },
    { days: 6, liters: 1500, hour: 10 },
    { days: 2, liters: 600, hour: 14 },
  ];

  for (const r of refills) {
    await db.insert(gasStationInbounds).values({
      liters: r.liters,
      note: `${MARKER} привоз бензовозом`,
      recordedAt: daysAgo(r.days, r.hour),
    });
  }

  // Pick a few drivers to write outbound fuel expenses against. If there are
  // no drivers, just write driverless expenses — the calculation still works.
  const driverRows = await db.select({ id: drivers.id, plate: drivers.vehiclePlate }).from(drivers).limit(4);

  // ~2 outbound dispenses per day for the last 12 days
  for (let dayBack = 12; dayBack >= 0; dayBack--) {
    const dispenses = rand(1, 3);
    for (let i = 0; i < dispenses; i++) {
      const drv = driverRows[rand(0, Math.max(0, driverRows.length - 1))];
      const liters = rand(40, 180);
      const pricePerL = 70;
      await db.insert(expenses).values({
        category: 'diesel',
        amountRub: liters * pricePerL,
        note: `${MARKER} заправка водителя с базы`,
        driverId: drv?.id ?? null,
        liters,
        recordedAt: daysAgo(dayBack, rand(7, 19), rand(0, 59)),
      });
    }
  }

  console.log('Base tank seeded: 4 inbounds + ~12 days of outbounds.');
  process.exit(0);
}

main().catch((e) => {
  console.error('seed-fuel-tank failed:', e);
  process.exit(1);
});
