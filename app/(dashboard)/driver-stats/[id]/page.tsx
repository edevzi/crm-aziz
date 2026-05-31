import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PeriodChips } from '@/components/stats/PeriodChips';
import { ResponseGauge } from '@/components/stats/ResponseGauge';
import { JourneyBars } from '@/components/stats/JourneyBars';
import { OrderList } from '@/components/stats/OrderList';
import { DriverActivityTimeline } from '@/components/DriverActivityTimeline';
import { getDriverActivity, averageDurations, stageStats, formatDuration } from '@/lib/driver-stats';

export const dynamic = 'force-dynamic';

function isOpen(s: string): boolean {
  return s !== 'completed';
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
  const completedTimelines = timelines.filter((t) => t.completedAt != null);
  const openTimelines = timelines.filter((t) => isOpen(t.status));
  const avg = averageDurations(timelines);
  const stats = stageStats(timelines);

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const backSuffix = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href={`/driver-stats${backSuffix}`}>
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {driver.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">{driver.vehiclePlate}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PeriodChips />
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
            <span><span className="font-extrabold text-slate-900">{timelines.length}</span> заказов</span>
            <span><span className="font-extrabold text-emerald-600">{completedTimelines.length}</span> завершено</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <Card className="border border-slate-200/60 shadow-sm rounded-3xl bg-white">
        <CardContent className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-center">
          <ResponseGauge seconds={avg.approve} size={132} />
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Завершено</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums leading-tight">
                {completedTimelines.length}
              </span>
              <span className="text-[11px] text-slate-400">из {timelines.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Открыто</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 tabular-nums leading-tight">
                {openTimelines.length}
              </span>
              <span className="text-[11px] text-slate-400">сейчас</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Всё время</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums leading-tight">
                {formatDuration(avg.total)}
              </span>
              <span className="text-[11px] text-slate-400">средн.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey + open orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Путь заказа · время на этап
            </h2>
            <JourneyBars stats={stats} />
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
            Открытые заказы
            {openTimelines.length > 0 && (
              <span className="ml-2 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md ring-1 ring-sky-100">
                {openTimelines.length}
              </span>
            )}
          </h2>
          <OrderList orders={openTimelines} emptyMessage="Открытых заказов нет" />
        </div>
      </div>

      {/* Completed orders with full timeline */}
      <div>
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
          Завершённые заказы
          {completedTimelines.length > 0 && (
            <span className="ml-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md ring-1 ring-emerald-100">
              {completedTimelines.length}
            </span>
          )}
        </h2>
        <DriverActivityTimeline timelines={completedTimelines} />
      </div>
    </div>
  );
}
