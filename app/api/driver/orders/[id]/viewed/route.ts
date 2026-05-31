import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logOrderEvent } from '@/lib/order-events';

export const dynamic = 'force-dynamic';

// Records the moment a driver first opens/views an order in the mobile app.
// Only the first view per order is stored — repeat calls are ignored.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    let driverId: number | null = null;
    try {
      const body = await request.json();
      if (body && body.driverId != null) driverId = parseInt(String(body.driverId));
    } catch {
      // body is optional
    }

    // Fall back to the order's assigned driver if not supplied
    if (driverId == null || isNaN(driverId)) {
      const [order] = await db
        .select({ driverId: orders.driverId })
        .from(orders)
        .where(eq(orders.id, orderId));
      driverId = order?.driverId ?? null;
    }

    const recorded = await logOrderEvent({
      orderId,
      driverId,
      event: 'viewed',
      actor: 'driver',
      onlyFirst: true,
    });

    return NextResponse.json({ ok: true, recorded });
  } catch (error) {
    console.error('Error recording order view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
