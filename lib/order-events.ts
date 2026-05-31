import { db } from '@/lib/db';
import { orderEvents } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export type OrderEventName =
  | 'created'
  | 'viewed'
  | 'assigned'
  | 'in_progress'
  | 'container_placed'
  | 'picked_up'
  | 'completed';

export type OrderEventActor = 'driver' | 'operator' | 'system';

/**
 * Records a single driver-activity event for an order. Designed to never throw —
 * a failure here must not break the surrounding order flow.
 *
 * @param onlyFirst  When true (used for 'viewed'), the event is inserted only if no
 *                   event with the same name already exists for this order.
 */
export async function logOrderEvent(params: {
  orderId: number;
  driverId?: number | null;
  event: OrderEventName;
  actor?: OrderEventActor;
  onlyFirst?: boolean;
}): Promise<boolean> {
  const { orderId, driverId = null, event, actor = 'driver', onlyFirst = false } = params;
  try {
    if (onlyFirst) {
      const [existing] = await db
        .select({ id: orderEvents.id })
        .from(orderEvents)
        .where(and(eq(orderEvents.orderId, orderId), eq(orderEvents.event, event)))
        .limit(1);
      if (existing) return false;
    }
    await db.insert(orderEvents).values({ orderId, driverId: driverId ?? null, event, actor });
    return true;
  } catch (err) {
    console.error('logOrderEvent failed', { orderId, event, actor }, err);
    return false;
  }
}
