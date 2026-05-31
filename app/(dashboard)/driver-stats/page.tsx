import React from 'react';
import Link from 'next/link';
import { Activity, Timer, CheckCircle2, Truck, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowLink } from '@/components/TableRowLink';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { getDriverStatsOverview, formatDuration } from '@/lib/driver-stats';

export const dynamic = 'force-dynamic';

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Статистика водителей</h1>
            <p className="text-slate-500 mt-1 font-medium">Время выполнения заказов по этапам</p>
          </div>
        </div>
        <DashboardDatePicker />
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatTile label="Водителей" value={String(global.driverCount)} hint={`${global.orderCount} заказов`} />
        <StatTile label="Завершено" value={String(global.completedCount)} hint="заказов" />
        <StatTile label="Ср. приёмка" value={formatDuration(global.avg.approve)} hint="просмотр → принял" />
        <StatTile label="Ср. погрузка" value={formatDuration(global.avg.place)} hint="выезд → поставил" />
        <StatTile label="Ср. забор" value={formatDuration(global.avg.pickup)} hint="поставил → забрал" />
        <StatTile label="Ср. итого" value={formatDuration(global.avg.total)} hint="просмотр → завершил" />
      </div>

      {/* Leaderboard */}
      <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-purple-600" />
            Рейтинг водителей
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Eye className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-slate-700 font-bold">Данных пока нет</p>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Статистика накапливается по новым заказам — как только водители начнут просматривать
                и выполнять заказы, здесь появятся их показатели.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Водитель</TableHead>
                    <TableHead className="text-center">Заказов</TableHead>
                    <TableHead className="text-center">Завершено</TableHead>
                    <TableHead className="text-center">Приёмка</TableHead>
                    <TableHead className="text-center">Старт</TableHead>
                    <TableHead className="text-center">Погрузка</TableHead>
                    <TableHead className="text-center">Забор</TableHead>
                    <TableHead className="text-center">Итого</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((d) => (
                    <TableRowLink key={d.driverId} href={`/driver-stats/${d.driverId}${suffix}`}>
                      <TableCell>
                        <div className="font-bold text-slate-800">{d.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{d.vehiclePlate}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-700">{d.orderCount}</TableCell>
                      <TableCell className="text-center font-semibold text-emerald-600">{d.completedCount}</TableCell>
                      <TableCell className="text-center text-slate-600">{formatDuration(d.avg.approve)}</TableCell>
                      <TableCell className="text-center text-slate-600">{formatDuration(d.avg.start)}</TableCell>
                      <TableCell className="text-center text-slate-600">{formatDuration(d.avg.place)}</TableCell>
                      <TableCell className="text-center text-slate-600">{formatDuration(d.avg.pickup)}</TableCell>
                      <TableCell className="text-center font-bold text-slate-800">{formatDuration(d.avg.total)}</TableCell>
                      <TableCell className="text-right pr-4">
                        <ChevronRight className="h-4 w-4 text-slate-300 inline" />
                      </TableCell>
                    </TableRowLink>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
