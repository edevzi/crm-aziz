import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, clients } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverIdStr = searchParams.get('driverId');

    if (!driverIdStr) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    const driverId = parseInt(driverIdStr);
    if (isNaN(driverId)) {
      return NextResponse.json({ error: 'Invalid Driver ID' }, { status: 400 });
    }

    // Join orders with clients to get client details for the driver
    const driverOrders = await db
      .select({
        id: orders.id,
        address: orders.address,
        mapUrl: orders.mapUrl,
        scheduledAt: orders.scheduledAt,
        containerSizeM3: orders.containerSizeM3,
        containerNumber: orders.containerNumber,
        rentalDuration: orders.rentalDuration,
        status: orders.status,
        paymentAmount: orders.paymentAmount,
        paymentType: orders.paymentType,
        paymentStatus: orders.paymentStatus,
        operatorNote: orders.operatorNote,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        clientName: clients.name,
        clientPhone: clients.phone,
      })
      .from(orders)
      .innerJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.driverId, driverId))
      .orderBy(desc(orders.scheduledAt));

    return NextResponse.json(driverOrders);
  } catch (error) {
    console.error('Error fetching driver orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
