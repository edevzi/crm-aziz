import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { orders, expenses } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { logOrderEvent, type OrderEventName } from '@/lib/order-events';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, paymentType, paymentStatus, photoUrl } = body;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const previousStatus = order.status;

    // Require photo when transitioning to picked_up or completed (for internal vehicles)
    // This covers both container_placed → picked_up and in_progress → picked_up (skip case)
    const isPickupTransition =
      (status === 'picked_up' || status === 'completed') &&
      (order.status === 'container_placed' || order.status === 'in_progress') &&
      !order.isExternalVehicle;
    if (isPickupTransition && !photoUrl && !order.photoUrl) {
      return NextResponse.json({ error: 'Photo is required to confirm container pickup' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentType) updateData.paymentType = paymentType;
    let photoUrlToSave = photoUrl;
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (token) {
          const mimeTypeMatch = photoUrl.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
          const base64Data = photoUrl.replace(/^data:image\/[a-z0-9.-]+;base64,/, "");
          let buffer: any = Buffer.from(base64Data, 'base64');
          
          try {
            const sharp = (await import('sharp')).default;
            buffer = await sharp(buffer)
              .resize({ width: 800, withoutEnlargement: true })
              .jpeg({ quality: 45 })
              .toBuffer();
          } catch (sharpErr) {
            console.error('Sharp compression failed, uploading raw buffer:', sharpErr);
          }

          const { put } = await import('@vercel/blob');
          const blob = await put(`order-${orderId}-${Date.now()}.jpeg`, buffer, {
            contentType: 'image/jpeg',
            access: 'public',
            token: token,
          });
          photoUrlToSave = blob.url;
          console.log('Successfully uploaded compressed photo to Vercel Blob:', blob.url);
        } else {
          console.warn('BLOB_READ_WRITE_TOKEN is missing. Storing photo as base64 directly.');
        }
      } catch (err) {
        console.error('Error uploading to Vercel Blob:', err);
      }
    }

    if (photoUrlToSave) updateData.photoUrl = photoUrlToSave;
    if (paymentStatus) {
      if (paymentStatus === 'entered') {
        return NextResponse.json({ error: 'Drivers cannot confirm payment receipt' }, { status: 400 });
      }
      if (order.paymentStatus === 'entered') {
        // If it's already entered, do not let driver downgrade it to received. Just keep it entered.
        updateData.paymentStatus = 'entered';
      } else {
        updateData.paymentStatus = paymentStatus;
      }
    }
    
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    const updated = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Record the driver's status-change as an activity event (for driver statistics)
    if (status && status !== previousStatus) {
      await logOrderEvent({
        orderId,
        driverId: order.driverId,
        event: status as OrderEventName,
        actor: 'driver',
      });
    }

    // When driver completes the order: auto-enter payment for non-cash orders
    if (status === 'completed' && previousStatus !== 'completed') {
      const completedOrder = updated[0];
      if (completedOrder.paymentType !== 'cash' && completedOrder.paymentStatus !== 'entered') {
        await db.update(orders).set({
          paymentStatus: 'entered',
          isClosed: true,
        }).where(eq(orders.id, orderId));
      }
    }

    // Generate dispatcher and referral expenses when order is 'completed'
    if (status === 'completed' && previousStatus !== 'completed') {
      // Dispatcher fee as expense
      if (order.dispatcherFee && order.dispatcherFee > 0 && order.dispatcherId) {
        const [existingDisp] = await db.select().from(expenses).where(
          and(eq(expenses.orderId, orderId), eq(expenses.category, 'dispatcher_salary'))
        );
        if (!existingDisp) {
          await db.insert(expenses).values({
            category: 'dispatcher_salary',
            amountRub: order.dispatcherFee,
            note: `Услуга диспетчера за заказ #${orderId}`,
            orderId: orderId,
            dispatcherId: order.dispatcherId,
            operatorId: undefined,
          });
        }
      }

      // Driver salary expense
      if (order.driverFee && order.driverFee > 0 && order.driverId) {
        const [existingDriver] = await db.select().from(expenses).where(
          and(eq(expenses.orderId, orderId), eq(expenses.category, 'driver_salary'))
        );
        if (!existingDriver) {
          await db.insert(expenses).values({
            category: 'driver_salary',
            amountRub: order.driverFee,
            note: `Зарплата водителя за заказ #${orderId}`,
            orderId: orderId,
            driverId: order.driverId,
            operatorId: undefined,
          });
        }
      }

      // Referral fee
      if (order.referralPercent && order.referralPercent > 0) {
        const [existingRef] = await db.select().from(expenses).where(
          and(eq(expenses.orderId, orderId), eq(expenses.category, 'referral_fee'))
        );
        if (!existingRef) {
          const feeAmount = (order.paymentAmount * order.referralPercent) / 100;
          await db.insert(expenses).values({
            category: 'referral_fee',
            amountRub: Math.round(feeAmount),
            note: `Процент для 3-го лица (${order.referralName || 'Аноним'}) за заказ #${orderId}`,
            orderId: orderId,
            operatorId: undefined,
          });
        }
      }

      // Insert inbound warehouse transaction if internal vehicle
      if (!order.isExternalVehicle) {
        const warehouseTransactions = (await import('@/lib/schema')).warehouseTransactions;
        const [existingTx] = await db.select().from(warehouseTransactions).where(
          eq(warehouseTransactions.orderId, orderId)
        );
        if (!existingTx) {
          await db.insert(warehouseTransactions).values({
            type: 'inbound',
            volumeM3: order.containerSizeM3,
            containerSizeM3: order.containerSizeM3,
            containerCount: 1, // Defaulting to 1 for orders as order schema doesn't have count
            note: `Автоматический приход с заказа #${orderId} (через моб.приложение)`,
            orderId: orderId,
            operatorId: undefined,
          });
        }
      }
    }

    revalidateTag('warehouse');

    revalidateTag('expenses');
    revalidateTag('orders');
    revalidatePath('/dashboard');
    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating driver order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
