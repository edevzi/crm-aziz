import { db } from './db';
import { orders, drivers } from './schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const driverRows = await db.select().from(drivers);
  console.log('=== DRIVERS & ORDERS ===\n');
  for (const d of driverRows) {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${orders.status} = 'completed')::int`,
        active: sql<number>`count(*) filter (where ${orders.status} != 'completed')::int`,
      })
      .from(orders)
      .where(eq(orders.driverId, d.id));

    const byStatus = await db
      .select({
        status: orders.status,
        cnt: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(eq(orders.driverId, d.id))
      .groupBy(orders.status);

    console.log(`${d.name} (id=${d.id}, user=${d.username}):`);
    console.log(`  jami: ${stats?.total ?? 0} | tugallangan: ${stats?.completed ?? 0} | FAOL: ${stats?.active ?? 0}`);
    for (const s of byStatus) {
      console.log(`    ${s.status}: ${s.cnt}`);
    }
    console.log('');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
