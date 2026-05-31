import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Activity } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { DriverActivityTimeline } from '@/components/DriverActivityTimeline';
import { getDriverActivity, averageDurations, formatDuration } from '@/lib/driver-stats';

export const dynamic = 'force-dynamic';

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default async function DriverStatsDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const driverId = parseInt(params.id);
  if (isNaN(driverId)) notFound();

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId));
  if (!driver) notFound();

  const from = searchParams?.from;
  const to = searchParams?.to;
  const timelines = await getDriverActivity(driverId, from, to);
  const avg = averageDurations(timelines);
  const completedCount = timelines.filter((t) => t.completedAt != null).length;

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const backSuffix = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href={`/driver-stats${backSuffix}`}>
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-purple-600" />
              {driver.name}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {driver.vehiclePlate} · {timelines.length} заказов · {completedCount} завершено
            </p>
          </div>
        </div>
        <DashboardDatePicker />
      </div>

      {/* Driver average KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatTile label="Ср. приёмка" value={formatDuration(avg.approve)} hint="просмотр → принял" />
        <StatTile label="Ср. старт" value={formatDuration(avg.start)} hint="принял → выехал" />
        <StatTile label="Ср. погрузка" value={formatDuration(avg.place)} hint="выезд → поставил" />
        <StatTile label="Ср. забор" value={formatDuration(avg.pickup)} hint="поставил → забрал" />
        <StatTile label="Ср. завершение" value={formatDuration(avg.complete)} hint="забрал → завершил" />
        <StatTile label="Ср. итого" value={formatDuration(avg.total)} hint="просмотр → завершил" />
      </div>

      {/* Per-order activity timeline */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Активность по заказам</h2>
        <DriverActivityTimeline timelines={timelines} />
      </div>
    </div>
  );
}
