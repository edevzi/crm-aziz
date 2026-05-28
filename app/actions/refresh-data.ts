'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

/** Clears cached lists so operator sees latest orders, drivers, finance, etc. */
export async function refreshOperatorData() {
  const tags = ['orders', 'clients', 'drivers', 'fuelLogs', 'expenses', 'warehouse'] as const;
  for (const tag of tags) {
    revalidateTag(tag);
  }

  for (const path of [
    '/dashboard',
    '/orders',
    '/clients',
    '/drivers',
    '/finance',
    '/fuel',
    '/warehouse',
    '/map',
  ]) {
    revalidatePath(path);
  }

  return { ok: true as const, at: new Date().toISOString() };
}
