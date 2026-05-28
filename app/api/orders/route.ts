import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allOrders = await db.select().from(orders);
    return NextResponse.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
