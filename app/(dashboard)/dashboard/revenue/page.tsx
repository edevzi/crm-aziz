import React from 'react';
import { getDashboardData, getFinanceData, getDrivers } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getDictionary } from '@/lib/dictionaries';
import { ArrowLeft, DollarSign, Truck, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRowLink } from '@/components/TableRowLink';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function RevenueDetailPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const [allOrders, , driversList, user] = await Promise.all([
    getDashboardData(),
    getFinanceData(),
    getDrivers(),
    getCurrentUser()
  ]);
  const isOperator = user?.role === 'operator';
  const currentUserId = user?.id;
  const driverMap = new Map(driversList.map(d => [d.id, d.name]));

  // Date Parsing Logic
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const fromParam = searchParams?.from as string;
  const toParam = searchParams?.to as string;

  const parseLocal = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0, 0);
  };

  const currentFrom = fromParam ? parseLocal(fromParam) : new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const currentTo = toParam ? parseLocal(toParam) : new Date(todayDate.getTime());
  currentTo.setHours(23, 59, 59, 999);

  const durationMs = currentTo.getTime() - currentFrom.getTime();
  
  const prevTo = new Date(currentFrom.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  prevFrom.setHours(0, 0, 0, 0);
  prevTo.setHours(23, 59, 59, 999);

  const isCurrent = (d: Date) => d >= currentFrom && d <= currentTo;
  const isPrev = (d: Date) => d >= prevFrom && d <= prevTo;

  let currentMetrics = {
    revenue: 0,
    revenueOwn: 0,
    revenueExternal: 0,
  };

  let prevMetrics = {
    revenue: 0,
    revenueOwn: 0,
    revenueExternal: 0,
  };

  // Lists of filtered orders/incomes for both streams
  const ownOrdersList: any[] = [];
  const externalOrdersList: any[] = [];

  for (const order of allOrders) {
    if (isOperator && order.operatorId !== currentUserId) continue;
    const orderDate = new Date(order.createdAt);

    if (order.paymentStatus === 'entered') {
      const amt = order.paymentAmount;
      const isExt = order.isExternalVehicle;
      
      if (isCurrent(orderDate)) {
        currentMetrics.revenue += amt;
        if (isExt) {
          currentMetrics.revenueExternal += amt;
          externalOrdersList.push({
            id: order.id,
            date: orderDate,
            amount: amt,
            driverName: order.externalDriverName || ('Сторонняя'),
            type: 'order',
            paymentType: order.paymentType,
            address: order.address
          });
        } else {
          currentMetrics.revenueOwn += amt;
          ownOrdersList.push({
            id: order.id,
            date: orderDate,
            amount: amt,
            driverName: order.driverId ? (driverMap.get(order.driverId) || `ID: ${order.driverId}`) : ('Не назначен'),
            type: 'order',
            paymentType: order.paymentType,
            address: order.address
          });
        }
      }
      if (isPrev(orderDate)) {
        prevMetrics.revenue += amt;
        if (isExt) prevMetrics.revenueExternal += amt;
        else prevMetrics.revenueOwn += amt;
      }
    }
  }



  // Sort timeline lists by date desc
  ownOrdersList.sort((a, b) => b.date.getTime() - a.date.getTime());
  externalOrdersList.sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = currentMetrics.revenue || 1;
  const ownPct = Math.round((currentMetrics.revenueOwn / total) * 100);
  const extPct = Math.round((currentMetrics.revenueExternal / total) * 100);

  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const totalTrend = calcTrend(currentMetrics.revenue, prevMetrics.revenue);
  const ownTrend = calcTrend(currentMetrics.revenueOwn, prevMetrics.revenueOwn);
  const extTrend = calcTrend(currentMetrics.revenueExternal, prevMetrics.revenueExternal);

  const renderTrendBadge = (trend: number) => {
    const isPositive = trend > 0;
    const isNegative = trend < 0;
    const isNeutral = trend === 0;

    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold w-fit ${
        isPositive ? 'bg-emerald-100 text-emerald-700' : isNegative ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
      }`}>
        {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
        {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
        {isNeutral && <Minus className="w-3.5 h-3.5" />}
        <span>{Math.abs(trend)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href="/dashboard">
              <ArrowLeft className="h-4.5 w-4.5 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {'Детализация оборота'}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {'Распределение оборота между своими и сторонними машинами'}
            </p>
          </div>
        </div>
        <DashboardDatePicker />
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Revenue Summary */}
        <Card className="border-0 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-950">
            <DollarSign className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {'Общий оборот'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-black text-slate-900 tracking-tight">
              {currentMetrics.revenue.toLocaleString()}{' '}
              <span className="text-xl font-bold text-slate-400">RUB</span>
            </div>
            {renderTrendBadge(totalTrend)}
            <p className="text-xs font-medium text-slate-400">
              {`Общий оборот за прошлый период: ${prevMetrics.revenue.toLocaleString()} RUB`}
            </p>
          </CardContent>
        </Card>

        {/* Own Vehicles (Свои машины) Summary */}
        <Card className="border-0 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-white relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{'Свои машины'}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                {ownPct}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentMetrics.revenueOwn.toLocaleString()}{' '}
              <span className="text-lg font-bold text-slate-400">RUB</span>
            </div>
            {renderTrendBadge(ownTrend)}
            <p className="text-xs font-medium text-slate-400">
              {`В прошлом периоде: ${prevMetrics.revenueOwn.toLocaleString()} RUB`}
            </p>
          </CardContent>
        </Card>

        {/* External Vehicles (Сторонние машины) Summary */}
        <Card className="border-0 shadow-lg shadow-blue-500/5 ring-1 ring-blue-100 rounded-3xl overflow-hidden bg-white relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{'Сторонние машины'}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black">
                {extPct}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentMetrics.revenueExternal.toLocaleString()}{' '}
              <span className="text-lg font-bold text-slate-400">RUB</span>
            </div>
            {renderTrendBadge(extTrend)}
            <p className="text-xs font-medium text-slate-400">
              {`В прошлом периоде: ${prevMetrics.revenueExternal.toLocaleString()} RUB`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar visual indicator */}
      <Card className="border border-slate-200/60 shadow-sm rounded-3xl bg-white p-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {'Диаграмма распределения'}
          </h3>
          <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${ownPct}%` }} className="bg-emerald-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" />
            <div style={{ width: `${extPct}%` }} className="bg-blue-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" />
          </div>
          <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 
              {`Свои машины: ${ownPct}%`}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 
              {`Сторонние машины: ${extPct}%`}
            </span>
          </div>
        </div>
      </Card>

      {/* Ledgers side-by-side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Own Vehicles List */}
        <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-row items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              {'Поступления: Свои машины'} ({ownOrdersList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/20">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>{dict.date || 'Дата'}</TableHead>
                  <TableHead>{'Водитель / Адрес'}</TableHead>
                  <TableHead className="text-right">{dict.amount || 'Сумма'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownOrdersList.map((item) => (
                  <TableRowLink href={`/orders/${item.id}`} key={item.id}>
                    <TableCell className="font-semibold text-slate-500">#{item.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {format(item.date, 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 truncate max-w-[200px]">
                      <div className="font-bold text-slate-800">{item.driverName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.address || '—'}</div>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-emerald-600 text-sm">
                      {item.amount.toLocaleString()} <span className="text-[10px] opacity-70">RUB</span>
                    </TableCell>
                  </TableRowLink>
                ))}
                {ownOrdersList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                      {'Нет заказов за этот период'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* External Vehicles List */}
        <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-row items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              {'Поступления: Сторонние машины'} ({externalOrdersList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/20">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>{dict.date || 'Дата'}</TableHead>
                  <TableHead>{'Водитель / Заметка'}</TableHead>
                  <TableHead className="text-right">{dict.amount || 'Сумма'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {externalOrdersList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-400">
                      {item.type === 'order' ? `#${item.id}` : '#O-' + item.id.replace('W-', '')}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {format(item.date, 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 truncate max-w-[200px]">
                      <div className="font-bold text-slate-800">{item.driverName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.address || 'База'}</div>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-blue-600 text-sm">
                      {item.amount.toLocaleString()} <span className="text-[10px] opacity-70">RUB</span>
                    </TableCell>
                  </TableRow>
                ))}
                {externalOrdersList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                      {'Нет поступлений за этот период'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
