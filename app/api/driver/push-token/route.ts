import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driverId, expoPushToken } = body;

    if (!driverId || !expoPushToken) {
      return NextResponse.json({ error: 'Missing driverId or expoPushToken' }, { status: 400 });
    }

    await db.update(drivers)
      .set({ expoPushToken })
      .where(eq(drivers.id, Number(driverId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push token:', error);
    return NextResponse.json({ error: 'Failed to save push token' }, { status: 500 });
  }
}
