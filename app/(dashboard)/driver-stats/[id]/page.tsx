import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { PeriodChips } from '@/components/stats/PeriodChips';
import { StepBreakdown } from '@/components/stats/StepBreakdown';
import { OrderBreakdownList } from '@/components/stats/OrderBreakdownList';
import { StepVsFleetChart } from '@/components/stats/charts/StepVsFleetChart';
import { TrendChart } from '@/components/stats/charts/TrendChart';
import { getDriverActivity, getDriverStatsOverview, stageStats, formatDuration } from '@/lib/driver-stats';
import { median, workSeconds, dailyWorkSeries } from '@/lib/driver-stats-compute';

export const dynamic = 'force-dynamic';

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="rounded-3xl bg-white border border-zinc-100 shadow-sm px-4 py-3.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-zinc-900">{value}</div>
      <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>
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
  const completed = timelines.filter((t) => t.completedAt != null);
  const stats = stageStats(timelines);
  const medWork = median(timelines.map(workSeconds));

  // Fleet baseline for the "vs парк" comparison.
  const overview = await getDriverStatsOverview(from, to);
  const fleet = overview.global.stats;

  // Daily trend over the selected window (defaults to the last 7 days).
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const series = dailyWorkSeries(timelines, fromDate, toDate);

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const back = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-zinc-200">
            <Link href={`/driver-stats${back}`}>
              <ArrowLeft className="h-4 w-4 text-zinc-700" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-none truncate">{driver.name}</h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">{driver.vehiclePlate}</p>
          </div>
        </div>
        <PeriodChips />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Заказов" value={`${completed.length}/${timelines.length}`} sub="завершено / всего" />
        <Kpi label="Работа / заказ" value={formatDuration(medWork)} sub="медиана, без аренды" />
        <Kpi label="Полный цикл" value={formatDuration(stats.total.median)} sub="медиана с арендой" />
        <Kpi label="Приём заказа" value={formatDuration(stats.approve.median)} sub="медиана реакции" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StepVsFleetChart stats={stats} fleet={fleet} />
        <TrendChart series={series} />
      </div>

      {/* Per-step averages (detail numbers) */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 px-1">Среднее время по этапам</h2>
        <StepBreakdown stats={stats} fleet={fleet} />
      </div>

      {/* Per-order breakdown */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 px-1 flex items-center gap-2">
          Заказы по этапам
          <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{timelines.length}</span>
        </h2>
        <OrderBreakdownList timelines={timelines} />
      </div>
    </div>
  );
}
