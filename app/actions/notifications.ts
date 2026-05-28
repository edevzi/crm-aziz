'use server';

import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/push-notifications';
import { getCurrentUser } from '@/lib/auth';

export async function sendCustomPushNotification(data: { title: string; body: string; target: 'all' | 'specific'; driverId?: number }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.title || !data.body) {
      return { success: false, error: 'Title and body are required' };
    }

    let targetTokens: string[] = [];

    if (data.target === 'all') {
      const allDrivers = await db.select({ expoPushToken: drivers.expoPushToken }).from(drivers).where(isNotNull(drivers.expoPushToken));
      targetTokens = allDrivers.map(d => d.expoPushToken).filter(Boolean) as string[];
    } else if (data.target === 'specific' && data.driverId) {
      const [driver] = await db.select({ expoPushToken: drivers.expoPushToken }).from(drivers).where(eq(drivers.id, data.driverId));
      if (driver?.expoPushToken) {
        targetTokens = [driver.expoPushToken];
      }
    } else {
      return { success: false, error: 'Invalid target configuration' };
    }

    if (targetTokens.length === 0) {
      return { success: false, error: 'Токены не найдены' };
    }

    // Send notifications to all collected tokens
    for (const token of targetTokens) {
      await sendPushNotification(token, data.title, data.body);
    }

    return { success: true, count: targetTokens.length };
  } catch (error: any) {
    console.error('Error sending custom push notification:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}
