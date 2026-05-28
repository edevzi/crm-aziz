'use server';

import { db } from '@/lib/db';
import { orders, expenses, warehouseTransactions, fuelLogs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function bulkReassignOperator(fromOperatorId: number, toOperatorId: number) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Update Orders
  await db.update(orders)
    .set({ operatorId: toOperatorId })
    .where(eq(orders.operatorId, fromOperatorId));

  // Update Expenses
  await db.update(expenses)
    .set({ operatorId: toOperatorId })
    .where(eq(expenses.operatorId, fromOperatorId));

  // Update Warehouse Transactions
  await db.update(warehouseTransactions)
    .set({ operatorId: toOperatorId })
    .where(eq(warehouseTransactions.operatorId, fromOperatorId));

  // Update Fuel Logs
  await db.update(fuelLogs)
    .set({ operatorId: toOperatorId })
    .where(eq(fuelLogs.operatorId, fromOperatorId));

  revalidateTag('orders');
  revalidateTag('expenses');
  revalidateTag('warehouse');
  revalidateTag('fuelLogs');
  revalidatePath('/management');
  revalidatePath('/orders');
  revalidatePath('/finance');
  revalidatePath('/dashboard');
}

export async function reassignOrder(orderId: number, toOperatorId: number) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Update specific Order
  await db.update(orders)
    .set({ operatorId: toOperatorId })
    .where(eq(orders.id, orderId));

  revalidateTag('orders');
  revalidatePath('/management');
  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/dashboard');
  revalidatePath('/finance');
}
