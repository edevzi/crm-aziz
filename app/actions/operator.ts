'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function createOperator(data: any) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  await db.insert(users).values({
    name: data.name,
    phone: data.phone,
    username: data.username,
    password: data.password,
    role: 'operator',
  });

  revalidateTag('users');
  revalidatePath('/operators');
}

export async function updateOperator(id: number, data: any) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const updateData: any = {
    name: data.name,
    phone: data.phone,
    username: data.username,
  };

  if (data.password) {
    updateData.password = data.password;
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidateTag('users');
  revalidatePath('/operators');
}

export async function deleteOperator(id: number) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Soft delete or hard delete. For now hard delete, but 
  // note that if operator has orders, it will fail due to FK constraints.
  // We can just try to delete, if fails, we can catch it.
  try {
    await db.delete(users).where(eq(users.id, id));
  } catch (error) {
    throw new Error('Cannot delete operator because they have associated records.');
  }

  revalidateTag('users');
  revalidatePath('/operators');
}
