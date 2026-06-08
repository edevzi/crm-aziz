/**
 * Clears ALL domain data but keeps:
 *   - users (admin & operator roles) and their sessions (nobody logged out)
 *   - drivers (haydovchilar ro'yxati saqlanadi)
 *
 * Run: npm run db:clean-keep-drivers-users
 */
import { db } from './db';
import {
  clients, orders, expenses, fuelLogs, warehouseTransactions,
  dispatchers, safeTransactions, utilizationLogs, gasStationInbounds, orderEvents,
} from './schema';

async function clean() {
  console.log('Clearing all data (keeping users, sessions & drivers)...');

  // Delete in FK-safe order: children first, parents last.
  // NB: drivers, users & sessions are intentionally NOT deleted.
  await db.delete(orderEvents);
  await db.delete(gasStationInbounds);
  await db.delete(expenses);
  await db.delete(fuelLogs);
  await db.delete(utilizationLogs);
  await db.delete(warehouseTransactions);
  await db.delete(safeTransactions);
  await db.delete(orders);
  await db.delete(clients);
  await db.delete(dispatchers);

  console.log('Done. Only users (admin & operator), their sessions and drivers remain.');
  process.exit(0);
}

clean().catch((err) => {
  console.error('Clean execution error:', err);
  process.exit(1);
});
