import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const driverIdStr = new URL(request.url).searchParams.get('driverId');
    if (!driverIdStr) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    const driverId = parseInt(driverIdStr, 10);
    if (isNaN(driverId)) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
    if (!driver) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehiclePlate: driver.vehiclePlate,
      },
    });
  } catch (error) {
    console.error('Driver validate error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
