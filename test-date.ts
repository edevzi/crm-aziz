import { db } from './lib/db';
import { orders } from './lib/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function run() {
  const [order] = await db.select().from(orders).limit(1);
  if (!order) return;
  console.log('Original db scheduledAt:', order.scheduledAt, 'updatedAt:', order.updatedAt);
  
  await db.update(orders).set({ updatedAt: new Date() }).where(eq(orders.id, order.id));
  
  const [updated] = await db.select().from(orders).where(eq(orders.id, order.id));
  console.log('New db updatedAt:', updated.updatedAt);
  
  console.log('Local new Date():', new Date());
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
