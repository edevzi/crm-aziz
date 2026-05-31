import React from 'react';
import { Activity, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PeriodChips } from '@/components/stats/PeriodChips';
import { ResponseGauge } from '@/components/stats/ResponseGauge';
import { JourneyBars } from '@/components/stats/JourneyBars';
import { DriverLeaderboard } from '@/components/stats/DriverLeaderboard';
import { OrderList } from '@/components/stats/OrderList';
import { getDriverStatsOverview } from '@/lib/driver-stats';

export const dynamic = 'force-dynamic';

function isOpen(s: string): boolean {
  return s !== 'completed';
}

export default async function DriverStatsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const from = searchParams?.from;
  const to = searchParams?.to;
  const { drivers, global, activeOrders, period } = await getDriverStatsOverview(from, to);

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Статистика водителей
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PeriodChips />
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
            <span><span className="font-extrabold text-slate-900">{global.orderCount}</span> заказов</span>
            <span>
              <span className="font-extrabold text-slate-900">{global.driverCount}</span>
              <span className="text-slate-400"> из {global.totalDriverCount}</span> водителей
            </span>
          </div>
        </div>
      </div>

      {/* Hero: gauge + KPI numbers */}
      <Card className="border border-slate-200/60 shadow-sm rounded-3xl bg-white">
        <CardContent className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-center">
          <ResponseGauge seconds={global.avg.approve} size={132} />
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Завершено</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums leading-tight">
                {global.completedCount}
              </span>
              <span className="text-[11px] text-slate-400">из {global.orderCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">В работе</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 tabular-nums leading-tight">
                {activeOrders.length}
              </span>
              <span className="text-[11px] text-slate-400">сейчас</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Водителей</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums leading-tight">
                {global.driverCount}
                <span className="text-base sm:text-lg font-bold text-slate-400"> / {global.totalDriverCount}</span>
              </span>
              <span className="text-[11px] text-slate-400">работали в периоде</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two columns on desktop: journey + leaderboard. Stack on mobile. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Journey bars */}
        <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Путь заказа · среднее время на этап
            </h2>
            <JourneyBars durations={global.avg} sampleCount={global.orderCount} />
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6 pb-3">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              Время реакции по водителям
            </h2>
          </div>
          {drivers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Нет водителей за период</div>
          ) : (
            <DriverLeaderboard drivers={drivers} suffix={suffix} metric="approve" />
          )}
        </Card>
      </div>

      {/* Live work */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-500" />
            Сейчас в работе
            {activeOrders.length > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md ring-1 ring-emerald-100">
                {activeOrders.length}
              </span>
            )}
          </h2>
        </div>
        <OrderList orders={activeOrders} emptyMessage="Сейчас никто не выполняет заказ" />
      </div>
    </div>
  );
}
