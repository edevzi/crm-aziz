import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Creating 'order_events' table...");
  await sql(`
    CREATE TABLE IF NOT EXISTS order_events (
      id serial PRIMARY KEY,
      order_id integer NOT NULL REFERENCES orders(id),
      driver_id integer REFERENCES drivers(id),
      event text NOT NULL,
      actor text NOT NULL DEFAULT 'driver',
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);

  console.log("Creating indexes on 'order_events'...");
  await sql(`CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events (order_id);`);
  await sql(`CREATE INDEX IF NOT EXISTS order_events_driver_created_idx ON order_events (driver_id, created_at);`);

  console.log("Migration successful! 'order_events' is ready.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
