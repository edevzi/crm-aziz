import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Lightweight client-error sink. The dashboard / global error boundaries POST the
 * real exception here so it shows up in the Vercel runtime logs (otherwise a
 * client-side crash on a user's phone is invisible to us). Helps diagnose the
 * intermittent "Не удалось загрузить" reports from mobile.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    console.error('[client-error]', JSON.stringify(body));
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
