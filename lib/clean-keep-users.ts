/**
 * Clears ALL domain data but keeps the existing users (admin & operator roles)
 * and their sessions, so nobody is logged out.
 *
 * Run: npm run db:clean-keep-users
 */
import { db } from './db';
import {
  clients, drivers, orders, expenses, fuelLogs, warehouseTransactions,
  dispatchers, safeTransactions, utilizationLogs, gasStationInbounds, orderEvents,
} from './schema';

async function clean() {
  console.log('Clearing all data (keeping users & sessions)...');

  // Delete in FK-safe order: children first, parents last.
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
  await db.delete(drivers);

  console.log('Done. Only users (admin & operator roles) and their sessions remain.');
  process.exit(0);
}

clean().catch((err) => {
  console.error('Clean execution error:', err);
  process.exit(1);
});
