import { db } from "@/lib/db";
import { drivers } from "@/lib/schema";
import { NotificationForm } from "./NotificationForm";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  // Fetch only drivers who have a push token
  const driversWithTokens = await db
    .select({
      id: drivers.id,
      name: drivers.name,
      vehiclePlate: drivers.vehiclePlate,
    })
    .from(drivers)
    .orderBy(desc(drivers.id));

  const lang = 'ru'; // Or get it from cookies/settings if dynamic

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      <NotificationForm drivers={driversWithTokens} lang={lang} />
    </div>
  );
}
