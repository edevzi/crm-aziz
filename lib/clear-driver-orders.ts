import { db } from './db';
import { orders, drivers } from './schema';
import { eq } from 'drizzle-orm';

const DRIVER_USERNAME = process.argv[2] ?? 'driver';

async function main() {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.username, DRIVER_USERNAME))
    .limit(1);

  if (!driver) {
    console.error(`Haydovchi topilmadi: username="${DRIVER_USERNAME}"`);
    process.exit(1);
  }

  const deleted = await db
    .delete(orders)
    .where(eq(orders.driverId, driver.id))
    .returning({ id: orders.id });

  console.log(`${driver.name} (${driver.username}): ${deleted.length} ta buyurtma o'chirildi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
