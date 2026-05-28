import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driverId, latitude, longitude } = body;

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    const updated = await db
      .update(drivers)
      .set({
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        locationUpdatedAt: new Date(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Revalidate drivers cache
    revalidateTag('drivers');

    return NextResponse.json({ 
      success: true, 
      driver: {
        id: updated[0].id,
        name: updated[0].name,
        latitude: updated[0].latitude,
        longitude: updated[0].longitude,
        locationUpdatedAt: updated[0].locationUpdatedAt
      } 
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
