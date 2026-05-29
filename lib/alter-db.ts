import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Starting manual SQL migration...");
  
  // 1. Alter rental_duration type from custom enum to text in PostgreSQL safely
  console.log("Altering 'rental_duration' in 'orders' to TYPE text...");
  await sql(`ALTER TABLE orders ALTER COLUMN rental_duration TYPE text;`);

  console.log("Adding 'driver_fee' column to 'orders' table...");
  try {
    await sql(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_fee integer;`);
  } catch (err) {
    console.log("driver_fee column already exists or couldn't be added:", err);
  }

  console.log("Adding 'wage_per_order' column to 'drivers' table...");
  try {
    await sql(`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS wage_per_order integer DEFAULT 0 NOT NULL;`);
  } catch (err) {
    console.log("wage_per_order column already exists or couldn't be added:", err);
  }
  
  console.log("Migration successful!");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
