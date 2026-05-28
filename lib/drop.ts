import { db } from './db';
import { sql } from 'drizzle-orm';

async function dropAll() {
  console.log('Dropping all tables...');
  await db.execute(sql`DROP TABLE IF EXISTS warehouse_income CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS expenses CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS fuel_logs CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS orders CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS clients CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS drivers CASCADE;`);
  console.log('Tables dropped.');
  process.exit(0);
}

dropAll().catch(console.error);
