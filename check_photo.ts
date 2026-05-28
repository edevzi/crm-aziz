import { db } from './lib/db';
import { orders } from './lib/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const result = await db.select({ photoUrl: orders.photoUrl }).from(orders).where(eq(orders.id, 1695));
  console.log('Order 1695 photoUrl:', result[0]?.photoUrl ? 'Exists, length: ' + result[0].photoUrl.length : 'NULL or empty');
  process.exit(0);
}
main().catch(console.error);
