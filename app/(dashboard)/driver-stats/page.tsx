import React from 'react';
import { Activity } from 'lucide-react';
import { PeriodChips } from '@/components/stats/PeriodChips';
import { FleetSummary } from '@/components/stats/FleetSummary';
import { DriverBoard } from '@/components/stats/DriverBoard';
import { DriverCompareChart } from '@/components/stats/charts/DriverCompareChart';
import { getDriverStatsOverview } from '@/lib/driver-stats';

export const dynamic = 'force-dynamic';

export default async function DriverStatsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const from = searchParams?.from;
  const to = searchParams?.to;
  const { drivers, global } = await getDriverStatsOverview(from, to);

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-none">Статистика водителей</h1>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {global.driverCount} из {global.totalDriverCount} водителей · {global.completedCount} из {global.orderCount} заказов завершено
            </p>
          </div>
        </div>
        <PeriodChips />
      </div>

      {/* Overall — all drivers combined */}
      <FleetSummary
        orderCount={global.orderCount}
        completedCount={global.completedCount}
        driverCount={global.driverCount}
        totalDriverCount={global.totalDriverCount}
        medianWorkSec={global.medianWorkSec}
        stats={global.stats}
      />

      {/* Visual comparison */}
      <DriverCompareChart drivers={drivers} />

      {/* Per driver */}
      <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 px-1 pt-1">По водителям</h2>
      <DriverBoard drivers={drivers} suffix={suffix} />

      <p className="text-[11px] text-zinc-400 px-1 leading-relaxed">
        Медиана времени на каждый этап по водителю. «Работа» — медиана времени водителя на 1 заказ без срока аренды контейнера.
        Нажмите на заголовок столбца, чтобы отсортировать, или на водителя — для детальной статистики.
      </p>
    </div>
  );
}
