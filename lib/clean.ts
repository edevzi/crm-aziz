import { db } from './db';
import { clients, drivers, orders, expenses, fuelLogs, warehouseTransactions, users, sessions, dispatchers, safeTransactions, utilizationLogs, gasStationInbounds } from './schema';

async function clean() {
  console.log('Clearing all tables...');
  await db.delete(gasStationInbounds);
  await db.delete(sessions);
  await db.delete(expenses);
  await db.delete(fuelLogs);
  await db.delete(utilizationLogs);
  await db.delete(warehouseTransactions);
  await db.delete(orders);
  await db.delete(safeTransactions);
  await db.delete(clients);
  await db.delete(dispatchers);
  await db.delete(drivers);
  await db.delete(users);

  console.log('Inserting default users (1 Admin, 1 Operator)...');
  const [adminUser] = await db.insert(users).values({
    username: 'admin',
    password: 'admin1234',
    name: 'Admin Axror',
    role: 'admin',
  }).returning();

  const [operatorUser] = await db.insert(users).values({
    username: 'operator',
    password: 'op1234',
    name: 'Operator Aziz',
    role: 'operator',
  }).returning();

  console.log('Database successfully cleaned! Only default admin and operator users are registered.');
  console.log(`Admin User: admin / admin1234`);
  console.log(`Operator User: operator / op1234`);
}

clean().catch((err) => {
  console.error('Clean execution error:', err);
  process.exit(1);
});
