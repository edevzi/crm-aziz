import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const foundDrivers = await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.username, username), eq(drivers.password, password)))
      .limit(1);

    if (foundDrivers.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const driver = foundDrivers[0];
    
    // Return sanitized driver info
    return NextResponse.json({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehiclePlate: driver.vehiclePlate,
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
