import { db } from './db';
import { expenses, gasStationInbounds } from './schema';
import { like, sql } from 'drizzle-orm';

// One-shot housekeeping: strip "[seed:...] " prefixes from human-facing notes
// so they don't bleed into the UI. Idempotent and safe to re-run.

async function main() {
  const e = await db
    .update(expenses)
    .set({ note: sql`regexp_replace(${expenses.note}, '\\[seed:[^\\]]+\\]\\s*', '', 'g')` })
    .where(like(expenses.note, '%[seed:%'));
  const g = await db
    .update(gasStationInbounds)
    .set({ note: sql`regexp_replace(${gasStationInbounds.note}, '\\[seed:[^\\]]+\\]\\s*', '', 'g')` })
    .where(like(gasStationInbounds.note, '%[seed:%'));

  console.log('Stripped [seed:…] markers from notes.');
  process.exit(0);
}

main().catch((e) => {
  console.error('cleanup-seed-markers failed:', e);
  process.exit(1);
});
