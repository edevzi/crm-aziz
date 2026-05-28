'use server';

import { db } from '@/lib/db';
import { orders, warehouseTransactions, expenses } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function updateOrderStatus(orderId: number, status: any) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return;

  const previousStatus = order.status;
  
  const updateData: any = { status };
  
  if (status === 'completed' && previousStatus !== 'completed') {
    updateData.paymentStatus = 'entered';
    updateData.isClosed = true;
    
    const user = await getCurrentUser();
    if (user) {
      updateData.operatorId = user.id;
    }
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));

  if (status === 'completed' && previousStatus !== 'completed') {
    const user = await getCurrentUser();
    
    // Check if dispatcher fee expense already exists for this order
    if (order.dispatcherFee && order.dispatcherFee > 0 && order.dispatcherId) {
      const [existingDisp] = await db.select().from(expenses).where(
        and(eq(expenses.orderId, order.id), eq(expenses.category, 'dispatcher_salary'))
      );
      if (!existingDisp) {
        await db.insert(expenses).values({
          category: 'dispatcher_salary',
          amountRub: order.dispatcherFee,
          note: `Услуга диспетчера за заказ #${order.id}`,
          orderId: order.id,
          dispatcherId: order.dispatcherId, // Link to dispatcher!
          operatorId: user ? user.id : undefined,
        });
      }
    }

    // Check if referral fee expense already exists for this order
    if (order.referralPercent && order.referralPercent > 0) {
      const [existingRef] = await db.select().from(expenses).where(
        and(eq(expenses.orderId, order.id), eq(expenses.category, 'referral_fee'))
      );
      if (!existingRef) {
        const feeAmount = (order.paymentAmount * order.referralPercent) / 100;
        await db.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${order.referralName || 'Аноним'}) за заказ #${order.id}`,
          orderId: order.id,
          operatorId: user ? user.id : undefined,
        });
      }
    }

    // Insert inbound warehouse transaction if internal vehicle
    if (!order.isExternalVehicle) {
      const [existingTx] = await db.select().from(warehouseTransactions).where(
        eq(warehouseTransactions.orderId, order.id)
      );
      if (!existingTx) {
        await db.insert(warehouseTransactions).values({
          type: 'inbound',
          volumeM3: order.containerSizeM3,
          containerSizeM3: order.containerSizeM3,
          containerCount: 1, // Defaulting to 1 for orders as order schema doesn't have count
          note: `Автоматический приход с заказа #${order.id}`,
          orderId: order.id,
          operatorId: user ? user.id : undefined,
        });
      }
    }
  }

  revalidateTag('expenses');
  revalidatePath(`/finance`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders`);
  revalidatePath(`/dashboard`);
}

export async function updateOrderPayment(orderId: number, paymentStatus: any) {
  // get order first
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  
  if (!order) return;

  const previousStatus = order.paymentStatus;
  
  // Update order
  const updateData: any = { paymentStatus };
  
  if (paymentStatus === 'entered' && previousStatus !== 'entered') {
    const user = await getCurrentUser();
    if (user && user.role === 'operator') {
      updateData.operatorId = user.id;
    } else if (user) {
      updateData.operatorId = user.id; // Or leave null if admin? Let's assign it anyway
    }
    updateData.isClosed = true;
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));

  // If transitioned to 'entered'
  if (paymentStatus === 'entered' && previousStatus !== 'entered') {
    const user = await getCurrentUser();
    // 1. (Removed warehouse income insert)
    // 2. ALSO generate dispatcher fee if it doesn't exist yet!
    if (order.dispatcherFee && order.dispatcherFee > 0 && order.dispatcherId) {
      const [existingDisp] = await db.select().from(expenses).where(
        and(eq(expenses.orderId, order.id), eq(expenses.category, 'dispatcher_salary'))
      );
      if (!existingDisp) {
        await db.insert(expenses).values({
          category: 'dispatcher_salary',
          amountRub: order.dispatcherFee,
          note: `Услуга диспетчера за заказ #${order.id}`,
          orderId: order.id,
          dispatcherId: order.dispatcherId, // Link to dispatcher!
          operatorId: user ? user.id : undefined,
        });
      }
    }
    
    // 3. ALSO generate referral fee if it doesn't exist yet!
    if (order.referralPercent && order.referralPercent > 0) {
      const [existingRef] = await db.select().from(expenses).where(
        and(eq(expenses.orderId, order.id), eq(expenses.category, 'referral_fee'))
      );
      if (!existingRef) {
        const feeAmount = (order.paymentAmount * order.referralPercent) / 100;
        await db.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${order.referralName || 'Аноним'}) за заказ #${order.id}`,
          orderId: order.id,
          operatorId: user ? user.id : undefined,
        });
      }
    }
  }

  revalidateTag('warehouse');
  revalidateTag('expenses');
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/finance`);
  revalidatePath(`/warehouse`);
}
