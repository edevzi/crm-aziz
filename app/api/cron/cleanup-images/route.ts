import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq, isNotNull, lt, and } from 'drizzle-orm';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.warn('BLOB_READ_WRITE_TOKEN is missing. Skipping blob deletion but continuing DB update.');
    }

    // Determine the threshold for 30 days retention
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find orders that have a photo and are older than 30 days
    const expiredOrders = await db
      .select({
        id: orders.id,
        photoUrl: orders.photoUrl,
      })
      .from(orders)
      .where(
        and(
          isNotNull(orders.photoUrl),
          lt(orders.updatedAt, thirtyDaysAgo)
        )
      );

    let deletedCount = 0;
    let dbUpdatedCount = 0;

    for (const order of expiredOrders) {
      if (order.photoUrl) {
        // Only delete from Vercel Blob if it's a Vercel Blob URL
        const isVercelBlob = order.photoUrl.includes('vercel-storage.com');
        
        if (isVercelBlob && token) {
          try {
            await del(order.photoUrl, { token });
            deletedCount++;
            console.log(`Deleted Vercel Blob image for order #${order.id}: ${order.photoUrl}`);
          } catch (blobErr) {
            console.error(`Failed to delete blob for order #${order.id}:`, blobErr);
          }
        }

        // Set photoUrl to null in the database regardless of Vercel Blob deletion success
        try {
          await db
            .update(orders)
            .set({ photoUrl: null, updatedAt: new Date() })
            .where(eq(orders.id, order.id));
          dbUpdatedCount++;
        } catch (dbErr) {
          console.error(`Failed to update DB for order #${order.id}:`, dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed expired images. Deleted ${deletedCount} blobs, updated ${dbUpdatedCount} database records.`,
    });
  } catch (error: any) {
    console.error('Image cleanup cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
