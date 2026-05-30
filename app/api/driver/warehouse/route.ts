import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warehouseTransactions } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';

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

    const transactions = await db
      .select({
        id: warehouseTransactions.id,
        type: warehouseTransactions.type,
        volumeM3: warehouseTransactions.volumeM3,
        containerSizeM3: warehouseTransactions.containerSizeM3,
        containerCount: warehouseTransactions.containerCount,
        driverAmount: warehouseTransactions.driverAmount,
        svalkaAmount: warehouseTransactions.svalkaAmount,
        note: warehouseTransactions.note,
        recordedAt: warehouseTransactions.recordedAt,
      })
      .from(warehouseTransactions)
      .where(and(
        eq(warehouseTransactions.driverId, driverId),
        eq(warehouseTransactions.type, 'outbound')
      ))
      .orderBy(desc(warehouseTransactions.recordedAt));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching driver warehouse transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
