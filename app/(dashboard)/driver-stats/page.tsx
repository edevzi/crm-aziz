import React from 'react';
import Link from 'next/link';
import { Activity, Truck, CheckCircle2, Eye, ChevronRight, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { JourneyFlow, JourneyLegend } from '@/components/stats/JourneyFlow';
import { PeriodBanner } from '@/components/stats/PeriodBanner';
import { MetricCard } from '@/components/stats/MetricCard';
import { LiveActivity } from '@/components/stats/LiveActivity';
import { getDriverStatsOverview, formatDuration } from '@/lib/driver-stats';
import type { DriverStat } from '@/lib/driver-stats';
import { STAGE_BY_KEY, stageQuality, overallRating, RATING_BADGE, type Quality } from '@/lib/driver-stats-meta';

export const dynamic = 'force-dynamic';

const QTEXT: Record<Quality, string> = {
  good: 'text-emerald-600',
  ok: 'text-amber-600',
  slow: 'text-rose-600',
  neutral: 'text-slate-500',
};

const QTILE: Record<Quality, string> = {
  good: 'bg-emerald-50 ring-emerald-100',
  ok: 'bg-amber-50 ring-amber-100',
  slow: 'bg-rose-50 ring-rose-100',
  neutral: 'bg-slate-50 ring-slate-100',
};

const RANK = ['bg-amber-400 text-white', 'bg-slate-300 text-slate-700', 'bg-orange-300 text-white'];

function MiniStat({ k, value }: { k: 'start' | 'place' | 'complete'; value: number | null }) {
  const cls = QTEXT[stageQuality(k, value)];
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{STAGE_BY_KEY[k].title}</p>
      <p className={`text-sm font-bold ${cls}`}>{formatDuration(value)}</p>
    </div>
  );
}

function DriverCard({ d, rank, suffix }: { d: DriverStat; rank: number; suffix: string }) {
  const aQ = stageQuality('approve', d.avg.approve);
  const rating = overallRating(d.avg);
  return (
    <Link href={`/driver-stats/${d.driverId}${suffix}`} className="block ds-fade">
      <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white hover:shadow-md hover:border-slate-300 transition-all h-full">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${RANK[rank - 1] || 'bg-slate-100 text-slate-500'}`}>
                {rank}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-800 truncate leading-tight">{d.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{d.vehiclePlate}</p>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ring-1 ${QTILE[rating]} ${QTEXT[rating]}`}>
              {RATING_BADGE[rating]}
            </span>
          </div>

          <div className={`mt-4 rounded-xl ring-1 ${QTILE[aQ]} p-3`}>
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Время реакции
            </p>
            <p className={`text-2xl font-extrabold mt-0.5 ${QTEXT[aQ]}`}>{formatDuration(d.avg.approve)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">в среднем — от открытия до принятия</p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat k="start" value={d.avg.start} />
            <MiniStat k="place" value={d.avg.place} />
            <MiniStat k="complete" value={d.avg.complete} />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>{d.orderCount} заказов · <span className="text-emerald-600 font-bold">{d.completedCount} завершено</span></span>
            <span className="flex items-center gap-0.5">Подробнее <ChevronRight className="h-3.5 w-3.5" /></span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DriverStatsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const from = searchParams?.from;
  const to = searchParams?.to;
  const { drivers, global, activeOrders, period } = await getDriverStatsOverview(from, to);

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const aQ = stageQuality('approve', global.avg.approve);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="ds-fade flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Статистика водителей</h1>
              <p className="text-slate-500 mt-1 text-sm font-medium">Сколько времени водители тратят на каждый шаг работы с заказом</p>
            </div>
          </div>
          <DashboardDatePicker />
        </div>
        <PeriodBanner periodName={period.name} periodLabel={period.label} orderCount={global.orderCount} />
      </div>

      {/* Live activity — what's happening RIGHT NOW */}
      <LiveActivity activeOrders={activeOrders} />

      {/* KPIs with inline explanations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Время реакции"
          icon={<Zap className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          value={formatDuration(global.avg.approve)}
          valueColor={QTEXT[aQ]}
          explanation={
            global.orderCount > 0
              ? `Сколько в среднем проходит от момента, когда водитель открыл заказ в приложении, до момента, когда он его принял. Считается по ${global.orderCount} заказам.`
              : 'Появится, когда водители начнут открывать и принимать заказы.'
          }
          footer={
            <p className="text-[11px] text-slate-400">
              быстро — до 10 мин · нормально — до 30 мин · медленно — больше 30 мин
            </p>
          }
        />
        <MetricCard
          title="Завершено заказов"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          value={global.completedCount}
          unit={global.orderCount > 0 ? `из ${global.orderCount}` : undefined}
          explanation={`Заказы со статусом «завершён» за выбранный период. ${activeOrders.length > 0 ? `Ещё ${activeOrders.length} — в работе.` : 'Активных заказов сейчас нет.'}`}
        />
        <MetricCard
          title="Активных водителей"
          icon={<Truck className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          value={global.driverCount}
          explanation={`Водители, у которых был хотя бы один заказ в выбранный период. Всего заказов с водителем: ${global.orderCount}.`}
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
            Среднее время на каждом этапе — <span className="font-bold text-slate-700">{period.name.toLowerCase()}</span>, по{' '}
            <span className="font-bold text-slate-700">{global.orderCount}</span> заказам. Серый этап — срок аренды контейнера, не зависит от водителя.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {global.orderCount > 0 ? (
            <>
              <JourneyFlow durations={global.avg} />
              <JourneyLegend />
            </>
          ) : (
            <p className="text-slate-400 text-sm py-8 text-center">Данных пока нет — статистика появится по новым заказам.</p>
          )}
        </CardContent>
      </Card>

      {/* Drivers */}
      <div>
        <div className="ds-fade flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-purple-600" />
            Водители
          </h2>
          <p className="text-xs text-slate-400">отсортированы по числу заказов за период</p>
        </div>
        {drivers.length === 0 ? (
          <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
            <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-slate-700 font-bold">Нет данных за этот период</p>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Выберите другой период или дождитесь, пока водители начнут работать с заказами.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {drivers.map((d, i) => (
              <DriverCard key={d.driverId} d={d} rank={i + 1} suffix={suffix} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
