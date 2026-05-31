import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, Zap, Eye, Activity, Truck } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { JourneyFlow, JourneyLegend } from '@/components/stats/JourneyFlow';
import { ResponseGauge } from '@/components/stats/ResponseGauge';
import { PeriodBanner } from '@/components/stats/PeriodBanner';
import { MetricCard } from '@/components/stats/MetricCard';
import { DriverActivityTimeline } from '@/components/DriverActivityTimeline';
import { getDriverActivity, averageDurations, formatDuration, periodMetadata } from '@/lib/driver-stats';
import { overallRating, RATING_BADGE, stageQuality, type Quality } from '@/lib/driver-stats-meta';

export const dynamic = 'force-dynamic';

const QTEXT: Record<Quality, string> = {
  good: 'text-emerald-600',
  ok: 'text-amber-600',
  slow: 'text-rose-600',
  neutral: 'text-slate-500',
};
const RATING_TILE: Record<Quality, string> = {
  good: 'ring-emerald-100 text-emerald-700 bg-emerald-50',
  ok: 'ring-amber-100 text-amber-700 bg-amber-50',
  slow: 'ring-rose-100 text-rose-700 bg-rose-50',
  neutral: 'ring-slate-100 text-slate-600 bg-slate-50',
};

function isOpen(status: string) {
  // For the driver's own page: anything not yet finished is "open" (incl. new, assigned, in-flight).
  return status !== 'completed';
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
  const rating = overallRating(avg);
  const aQ = stageQuality('approve', avg.approve);

  // Build period metadata identical to the overview, so the banner reads consistently.
  const now = new Date();
  const periodFrom = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodTo = to ? new Date(to) : now;
  const period = periodMetadata(periodFrom, periodTo);

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const backSuffix = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="ds-fade flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
              <Link href={`/driver-stats${backSuffix}`}>
                <ArrowLeft className="h-4 w-4 text-slate-700" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{driver.name}</h1>
              <p className="text-slate-500 mt-1 text-sm font-medium font-mono">
                {driver.vehiclePlate}
              </p>
            </div>
          </div>
          <DashboardDatePicker />
        </div>
        <PeriodBanner periodName={period.name} periodLabel={period.label} orderCount={timelines.length} />
      </div>

      {/* Summary */}
      <Card className="ds-fade border border-slate-200/60 shadow-sm rounded-3xl bg-gradient-to-br from-white to-slate-50/60">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-7">
          <ResponseGauge seconds={avg.approve} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Время реакции</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ring-1 ${RATING_TILE[rating]}`}>{RATING_BADGE[rating]}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto sm:mx-0">
              Среднее время от момента, когда водитель открыл заказ в приложении, до момента, когда он его принял. Считается по {timelines.length} заказам.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs with explanations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Завершено"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          value={completedTimelines.length}
          unit={timelines.length > 0 ? `из ${timelines.length}` : undefined}
          explanation={`Заказы, которые водитель довёл до статуса «завершён». ${openTimelines.length > 0 ? `Ещё ${openTimelines.length} сейчас в работе.` : 'Сейчас активных заказов нет.'}`}
        />
        <MetricCard
          title="Открыто"
          icon={<Activity className="h-5 w-5" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          value={openTimelines.length}
          explanation="Заказы, ещё не доведённые до статуса «завершён»: новые, принятые, в пути или с поставленным контейнером."
        />
        <MetricCard
          title="Всё время"
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          value={formatDuration(avg.total)}
          explanation="Полный цикл — от открытия заказа в приложении до его завершения. Включает срок аренды контейнера."
        />
      </div>

      {/* Journey */}
      <Card className="ds-fade border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-600" />
            Путь заказа — где уходит время
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1 normal-case font-medium">
            Среднее время на каждом этапе по{' '}
            <span className="font-bold text-slate-700">{timelines.length}</span> заказам этого водителя —{' '}
            <span className="font-bold text-slate-700">{period.name.toLowerCase()}</span>.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {timelines.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">Нет данных за период.</p>
          ) : (
            <>
              <JourneyFlow durations={avg} />
              <JourneyLegend />
            </>
          )}
        </CardContent>
      </Card>

      {/* Open (not yet completed) orders */}
      {openTimelines.length > 0 && (
        <div>
          <div className="ds-fade flex items-baseline gap-3 mb-3 flex-wrap">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="ds-live-dot inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Открытые заказы
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md ring-1 ring-emerald-100">
                {openTimelines.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">ещё не завершены — новые, принятые или в пути</p>
          </div>
          <DriverActivityTimeline timelines={openTimelines} />
        </div>
      )}

      {/* Completed orders */}
      <div>
        <div className="ds-fade flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Завершённые заказы
            {completedTimelines.length > 0 && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md ring-1 ring-slate-200">
                {completedTimelines.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">с полным таймлайном этапов</p>
        </div>
        <DriverActivityTimeline timelines={completedTimelines} />
      </div>
    </div>
  );
}
