import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Starting manual SQL migration...");
  
  // 1. Alter rental_duration type from custom enum to text in PostgreSQL safely
  console.log("Altering 'rental_duration' in 'orders' to TYPE text...");
  await sql(`ALTER TABLE orders ALTER COLUMN rental_duration TYPE text;`);
  
  console.log("Migration successful!");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
