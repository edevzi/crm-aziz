import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, drivers } from '@/lib/schema';
import { eq, isNotNull, lt, and, isNull, or } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/push-notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Determine the threshold for notifications (e.g., 15 minutes ago)
    const notificationThreshold = new Date(Date.now() - 15 * 60 * 1000);
    
    // Find orders that are 'assigned', but their updatedAt is older than the threshold.
    // Also, ensure we haven't notified them recently (lastNotifiedAt is null or older than the last time the status was updated).
    const neglectedOrders = await db
      .select({
        orderId: orders.id,
        driverId: orders.driverId,
        updatedAt: orders.updatedAt,
        expoPushToken: drivers.expoPushToken,
      })
      .from(orders)
      .leftJoin(drivers, eq(orders.driverId, drivers.id))
      .where(
        and(
          eq(orders.status, 'assigned'),
          isNotNull(orders.driverId),
          lt(orders.updatedAt, notificationThreshold),
          or(
            isNull(orders.lastNotifiedAt),
            lt(orders.lastNotifiedAt, orders.updatedAt) // Notified before the last update, so we need to notify again for this new state
          )
        )
      );

    let sentCount = 0;

    for (const order of neglectedOrders) {
      if (order.expoPushToken) {
        // Send push notification
        const title = '🕒 Непринятый заказ!';
        const body = 'У вас есть непринятый заказ. Пожалуйста, подтвердите получение или начните выполнение, чтобы оператор был в курсе.';
        
        await sendPushNotification(order.expoPushToken, title, body, { orderId: order.orderId });
        
        // Update lastNotifiedAt
        await db.update(orders)
          .set({ lastNotifiedAt: new Date() })
          .where(eq(orders.id, order.orderId));

        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${neglectedOrders.length} orders. Sent ${sentCount} notifications.`,
    });
  } catch (error: any) {
    console.error('Smart notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
