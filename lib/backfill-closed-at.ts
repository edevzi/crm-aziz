/**
 * One-off backfill: stamp `closedAt` for orders that were already entered/closed
 * before the column existed.
 *
 * The exact moment an order was "entered" was never recorded historically, so we
 * use `updatedAt` as the best available proxy (for driver-completed orders this is
 * accurate; for admin-entered orders updatedAt may equal createdAt, in which case
 * the value is unchanged in practice).
 *
 * Run once after `npm run db:push`:
 *   npm run db:backfill-closed-at
 */
import { db } from './db';
import { orders } from './schema';
import { and, or, eq, isNull } from 'drizzle-orm';

async function main() {
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        isNull(orders.closedAt),
        or(eq(orders.isClosed, true), eq(orders.paymentStatus, 'entered'))
      )
    );

  console.log(`Found ${rows.length} entered/closed orders without closedAt.`);

  let updated = 0;
  for (const o of rows) {
    await db
      .update(orders)
      .set({ closedAt: o.updatedAt ?? o.createdAt })
      .where(eq(orders.id, o.id));
    updated++;
  }

  console.log(`Backfilled closedAt for ${updated} orders.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
