import React from 'react';
import { getDashboardData, getFinanceData, getClients, getDrivers, getSafeData } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { LayoutDashboard, Users, Truck, DollarSign, Fuel, CarFront, FileWarning, Recycle, Wrench, Briefcase, HandCoins, Warehouse, Activity, ChevronRight } from 'lucide-react';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { MetricCard } from '@/components/MetricCard';
import { getCurrentUser } from '@/lib/auth';
import { isOverdue } from '@/lib/utils';
import { getDriverStatsOverview, formatDuration } from '@/lib/driver-stats';

export const dynamic = 'force-dynamic';

function getStatusBadge(status: string, dict: any) {
  switch (status) {
    case 'new': return <Badge variant="info">{dict.new}</Badge>;
    case 'assigned': return <Badge variant="secondary">{dict.assigned}</Badge>;
    case 'in_progress': return <Badge variant="warning">{dict.in_progress}</Badge>;
    case 'container_placed': return <Badge variant="warning">{dict.container_placed}</Badge>;
    case 'picked_up': return <Badge variant="info">{dict.picked_up}</Badge>;
    case 'completed': return <Badge variant="success">{dict.completed}</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const [allOrders, { allExpenses }, allClients, allDrivers, user, safeData] = await Promise.all([
    getDashboardData(),
    getFinanceData(),
    getClients(),
    getDrivers(),
    getCurrentUser(),
    getSafeData()
  ]);
  const isOperator = user?.role === 'operator';
  const currentUserId = user?.id;

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
    revenue: 0, expenses: 0, profit: 0, safeTotal: 0,
    revenueOwn: 0, revenueExternal: 0,
    dispatcherOrders: 0, dispatcherFee: 0, dispatcherSalary: 0,
    fuel: 0, gai: 0, utilizationM3: 0, utilizationExpense: 0,
    spareParts: 0, driverSalary: 0,
    repair: 0, baseRent: 0, workerSalary: 0, referralFee: 0,
    other: 0, masterFee: 0, tractor: 0
  };

  let prevMetrics = {
    revenue: 0, expenses: 0, profit: 0, safeTotal: 0,
    revenueOwn: 0, revenueExternal: 0,
    dispatcherOrders: 0, dispatcherFee: 0, dispatcherSalary: 0,
    fuel: 0, gai: 0, utilizationM3: 0, utilizationExpense: 0,
    spareParts: 0, driverSalary: 0,
    repair: 0, baseRent: 0, workerSalary: 0, referralFee: 0,
    other: 0, masterFee: 0, tractor: 0
  };

  let pendingPayments = 0;
  let activeOrders = 0;
  let pendingConfirmation = 0;
  let overdueContainers = 0;

  for (const order of allOrders) {
    if (isOperator && order.operatorId !== currentUserId) continue;

    const orderDate = new Date(order.createdAt);
    
    // Check overdue
    if (isOverdue(order)) overdueContainers++;
    if (!order.isClosed && (order.status === 'completed' || order.paymentStatus === 'received')) {
      pendingConfirmation++;
    }

    // Revenue
    if (order.paymentStatus === 'entered') {
      const amt = order.paymentAmount;
      const isExt = order.isExternalVehicle;
      if (isCurrent(orderDate)) {
        currentMetrics.revenue += amt;
        if (isExt) currentMetrics.revenueExternal += amt;
        else currentMetrics.revenueOwn += amt;
      }
      if (isPrev(orderDate)) {
        prevMetrics.revenue += amt;
        if (isExt) prevMetrics.revenueExternal += amt;
        else prevMetrics.revenueOwn += amt;
      }
    }

    // Dispatcher
    if (order.dispatcherId) {
      if (isCurrent(orderDate)) {
        currentMetrics.dispatcherOrders++;
        currentMetrics.dispatcherFee += (order.dispatcherFee || 0);
      }
      if (isPrev(orderDate)) {
        prevMetrics.dispatcherOrders++;
        prevMetrics.dispatcherFee += (order.dispatcherFee || 0);
      }
    }

    // Utilization Volume
    if (order.status === 'completed') {
      if (isCurrent(orderDate)) currentMetrics.utilizationM3 += (order.containerSizeM3 || 0);
      if (isPrev(orderDate)) prevMetrics.utilizationM3 += (order.containerSizeM3 || 0);
    }

    // Active & Pending status counts for quick links (ignoring date)
    // Operators might want to see all active orders so they can pick them up.
    if (order.paymentStatus === 'pending') pendingPayments++;
    if (!order.isClosed && order.status !== 'completed') activeOrders++;
  }

  // Warehouse incomes removed from revenue tracking

  for (const s of safeData) {
    if (isOperator && s.transaction.operatorId !== currentUserId) continue;

    const sDate = new Date(s.transaction.recordedAt);
    if (isCurrent(sDate)) {
      if (s.transaction.type === 'income') {
        currentMetrics.safeTotal += s.transaction.amountRub;
      } else {
        currentMetrics.safeTotal -= s.transaction.amountRub;
      }
    }
    if (isPrev(sDate)) {
      if (s.transaction.type === 'income') {
        prevMetrics.safeTotal += s.transaction.amountRub;
      } else {
        prevMetrics.safeTotal -= s.transaction.amountRub;
      }
    }
  }

  for (const e of allExpenses) {
    if (isOperator && e.operatorId !== currentUserId) continue;

    const eDate = new Date(e.recordedAt);
    const amt = e.amountRub;
    
    if (isCurrent(eDate)) {
      currentMetrics.expenses += amt;
      if (e.category === 'fuel' || e.category === 'diesel') currentMetrics.fuel += amt;
      if (e.category === 'gai') currentMetrics.gai += amt;
      if (e.category === 'utilization') currentMetrics.utilizationExpense += amt;
      if (e.category === 'spare_parts') currentMetrics.spareParts += amt;
      if (e.category === 'driver_salary') currentMetrics.driverSalary += amt;
      if (e.category === 'dispatcher_salary') currentMetrics.dispatcherSalary += amt;
      if (e.category === 'repair') currentMetrics.repair += amt;
      if (e.category === 'base_rent') currentMetrics.baseRent += amt;
      if (e.category === 'worker_salary') currentMetrics.workerSalary += amt;
      if (e.category === 'referral_fee') currentMetrics.referralFee += amt;
      if (e.category === 'other') currentMetrics.other += amt;
      if (e.category === 'master_fee') currentMetrics.masterFee += amt;
      if (e.category === 'tractor') currentMetrics.tractor += amt;
    }
    if (isPrev(eDate)) {
      prevMetrics.expenses += amt;
      if (e.category === 'fuel' || e.category === 'diesel') prevMetrics.fuel += amt;
      if (e.category === 'gai') prevMetrics.gai += amt;
      if (e.category === 'utilization') prevMetrics.utilizationExpense += amt;
      if (e.category === 'spare_parts') prevMetrics.spareParts += amt;
      if (e.category === 'driver_salary') prevMetrics.driverSalary += amt;
      if (e.category === 'dispatcher_salary') prevMetrics.dispatcherSalary += amt;
      if (e.category === 'repair') prevMetrics.repair += amt;
      if (e.category === 'base_rent') prevMetrics.baseRent += amt;
      if (e.category === 'worker_salary') prevMetrics.workerSalary += amt;
      if (e.category === 'referral_fee') prevMetrics.referralFee += amt;
      if (e.category === 'other') prevMetrics.other += amt;
      if (e.category === 'master_fee') prevMetrics.masterFee += amt;
      if (e.category === 'tractor') prevMetrics.tractor += amt;
    }
  }

  currentMetrics.profit = currentMetrics.revenue - currentMetrics.expenses;
  prevMetrics.profit = prevMetrics.revenue - prevMetrics.expenses;

  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const totalClientsCount = allClients.length;
  const totalDriversCount = allDrivers.length;

  const recentOrders = allOrders
    .filter(o => !o.isClosed && o.status !== 'completed' && (!isOperator || o.operatorId === currentUserId))
    .slice(0, 8);

  // Generate chart days based on selected date range
  const chartDays: Date[] = [];
  const chartStart = new Date(currentFrom);
  while (chartStart <= currentTo) {
    chartDays.push(new Date(chartStart));
    chartStart.setDate(chartStart.getDate() + 1);
  }

  const chartFinanceData = chartDays.map(date => {
    const dateStr = format(date, 'dd.MM');
    const targetDateStr = format(date, 'yyyy-MM-dd');
    let income = 0;
    let expenses = 0;

    allOrders.forEach(order => {
      if (isOperator && order.operatorId !== currentUserId) return;
      const orderDate = new Date(order.createdAt);
      if (format(orderDate, 'yyyy-MM-dd') === targetDateStr && order.paymentStatus === 'entered') {
        income += order.paymentAmount;
      }
    });

    allExpenses.forEach(e => {
      if (isOperator && e.operatorId !== currentUserId) return;
      const eDate = new Date(e.recordedAt);
      if (format(eDate, 'yyyy-MM-dd') === targetDateStr) {
        expenses += e.amountRub;
      }
    });

    return { date: dateStr, income, expenses };
  });

  const expensesMap: Record<string, number> = {};
  allExpenses.forEach(e => {
    if (isOperator && e.operatorId !== currentUserId) return;
    if (isCurrent(new Date(e.recordedAt))) {
      expensesMap[e.category] = (expensesMap[e.category] || 0) + e.amountRub;
    }
  });

  const chartExpensesByCategory = Object.entries(expensesMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const resolvedFromParam = fromParam || format(currentFrom, 'yyyy-MM-dd');
  const resolvedToParam = toParam || format(currentTo, 'yyyy-MM-dd');

  const driverStats = await getDriverStatsOverview(resolvedFromParam, resolvedToParam);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.dashboard}</h1>
            <p className="text-slate-500 mt-1 font-medium">{"Мониторинг основных показателей"}</p>
          </div>
        </div>
        <DashboardDatePicker />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <MetricCard 
          title={'Оборот'} 
          value={currentMetrics.revenue} 
          prevValue={prevMetrics.revenue}
          unit="RUB" 
          trend={calcTrend(currentMetrics.revenue, prevMetrics.revenue)} 
          colorScheme="emerald"
          icon={<DollarSign className="w-12 h-12" />}
          href={`/dashboard/revenue?from=${resolvedFromParam}&to=${resolvedToParam}`}
        />
        <MetricCard 
          title={dict.expenses || 'Расход'} 
          value={currentMetrics.expenses} 
          prevValue={prevMetrics.expenses}
          unit="RUB" 
          trend={calcTrend(currentMetrics.expenses, prevMetrics.expenses)} 
          colorScheme="rose"
          icon={<DollarSign className="w-12 h-12" />}
          href={`/dashboard/expenses?from=${resolvedFromParam}&to=${resolvedToParam}`}
          percentageOfTotal={currentMetrics.revenue > 0 ? Math.round((currentMetrics.expenses / currentMetrics.revenue) * 100) : undefined}
          percentageLabel={'от оборота'}
        />
        <MetricCard 
          title={dict.net_profit || 'Чистая прибыль'} 
          value={currentMetrics.profit} 
          prevValue={prevMetrics.profit}
          unit="RUB" 
          trend={calcTrend(currentMetrics.profit, prevMetrics.profit)} 
          colorScheme={currentMetrics.profit >= 0 ? "cyan" : "orange"}
          icon={<HandCoins className="w-12 h-12" />}
          href={`/finance?tab=income&startDate=${resolvedFromParam}&endDate=${resolvedToParam}`}
          percentageOfTotal={currentMetrics.revenue > 0 ? Math.round((currentMetrics.profit / currentMetrics.revenue) * 100) : undefined}
          percentageLabel={'от оборота'}
        />
        <MetricCard 
          title={dict.safe || 'Сейф'} 
          value={currentMetrics.safeTotal} 
          prevValue={prevMetrics.safeTotal}
          unit="RUB" 
          trend={calcTrend(currentMetrics.safeTotal, prevMetrics.safeTotal)} 
          colorScheme="indigo"
          icon={<Warehouse className="w-12 h-12" />}
          href={`/safe`}
        />
      </div>

      {/* Driver statistics shortcut */}
      <Link href="/driver-stats" className="block">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20 p-5 sm:p-6 hover:brightness-105 transition-all active:scale-[0.99]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">Статистика водителей</p>
                <h3 className="text-white text-lg sm:text-xl font-extrabold tracking-tight">Как быстро водители принимают и выполняют заказы</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">Среднее время</p>
                <p className="text-white/80 text-[10px] font-medium hidden sm:block">от открытия до принятия</p>
                <p className="text-white text-base sm:text-lg font-extrabold">{formatDuration(driverStats.global.avg.approve)}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">Завершено заказов</p>
                <p className="text-white/80 text-[10px] font-medium">за выбранный период</p>
                <p className="text-white text-base sm:text-lg font-extrabold">{driverStats.global.completedCount}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-white/80 flex-shrink-0" />
            </div>
          </div>
        </div>
      </Link>

      <DashboardCharts
        financeData={chartFinanceData} 
        expensesByCategory={chartExpensesByCategory} 
        dict={dict} 
        revenue={currentMetrics.revenue}
        expenses={currentMetrics.expenses}
        profit={currentMetrics.profit}
        lang={lang}
      />

      {/* Revenue Allocation Analysis */}
      {currentMetrics.revenue > 0 && (
        <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              📊 {'Анализ распределения выручки'}
            </CardTitle>
            <p className="text-slate-400 text-xs mt-0.5">
              {`Какая часть выручки пошла на прибыль, а какая — на расходы (Всего получено: ${currentMetrics.revenue.toLocaleString()} RUB)`}
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Split Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>{'Чистая прибыль'}: {Math.max(0, Math.round((currentMetrics.profit / currentMetrics.revenue) * 100))}%</span>
                <span>{'Расходы'}: {Math.round((currentMetrics.expenses / currentMetrics.revenue) * 100)}%</span>
              </div>
              <div className="h-4.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${Math.max(0, Math.round((currentMetrics.profit / currentMetrics.revenue) * 100))}%` }} 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                />
                <div 
                  style={{ width: `${Math.round((currentMetrics.expenses / currentMetrics.revenue) * 100)}%` }} 
                  className="bg-rose-500 h-full transition-all duration-500" 
                />
              </div>
            </div>

            {/* Expenses Category Breakdowns as % of Revenue */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {'Расходы по категориям (% от выручки)'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'fuel', label: dict.fuel || 'Топливо', color: 'bg-amber-500', value: currentMetrics.fuel },
                  { key: 'driver_salary', label: dict.driver_salary || 'Зарплата водителя', color: 'bg-blue-500', value: currentMetrics.driverSalary },
                  { key: 'dispatcher_salary', label: dict.dispatcher_salary || 'Зарплата диспетчера', color: 'bg-indigo-500', value: currentMetrics.dispatcherSalary },
                  { key: 'utilization', label: dict.utilization || 'Утилизация', color: 'bg-purple-500', value: currentMetrics.utilizationExpense },
                  { key: 'spare_parts', label: dict.spare_parts || 'Запчасти', color: 'bg-slate-500', value: currentMetrics.spareParts },
                  { key: 'gai', label: dict.gai || 'ГАИ', color: 'bg-rose-500', value: currentMetrics.gai },
                  { key: 'repair', label: dict.repair || 'Ремонт', color: 'bg-orange-500', value: currentMetrics.repair },
                  { key: 'base_rent', label: dict.base_rent || 'Аренда базы', color: 'bg-teal-500', value: currentMetrics.baseRent },
                  { key: 'worker_salary', label: dict.worker_salary || 'Зарплата рабочих', color: 'bg-cyan-500', value: currentMetrics.workerSalary },
                  { key: 'referral_fee', label: dict.referral_fee || 'Реферальные', color: 'bg-pink-500', value: currentMetrics.referralFee },
                  { key: 'master_fee', label: dict.master_fee || 'Мастер', color: 'bg-violet-500', value: currentMetrics.masterFee },
                  { key: 'tractor', label: dict.tractor || 'Трактор', color: 'bg-lime-500', value: currentMetrics.tractor },
                  { key: 'other', label: dict.other || 'Прочее', color: 'bg-gray-500', value: currentMetrics.other },
                ]
                .filter(item => item.value > 0)
                .map(item => {
                  const pct = Math.round((item.value / currentMetrics.revenue) * 100);
                  return (
                    <div key={item.key} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color} inline-block`} />
                          {item.label}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className={`h-full ${item.color} rounded-full`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        {item.value.toLocaleString()} RUB
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>{dict.recent_orders}</CardTitle>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <Link href="/orders?status=active" className="text-xs sm:text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">
              {'Активные'} ({activeOrders})
            </Link>
            <Link href="/orders?status=pending_confirmation" className="text-xs sm:text-sm font-medium text-amber-600 hover:underline whitespace-nowrap">
              {'Ждут подтверждения'} ({pendingConfirmation})
            </Link>
            {overdueContainers > 0 && (
              <Link href="/orders?status=overdue_containers" className="text-xs sm:text-sm font-medium text-rose-600 hover:underline whitespace-nowrap">
                {'Просрочены'} ({overdueContainers})
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
              <TableRow>
                <TableHead>{dict.date}</TableHead>
                <TableHead>{dict.address}</TableHead>
                <TableHead>{dict.status}</TableHead>
                <TableHead>{dict.payment}</TableHead>
                <TableHead className="text-right">{dict.amount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRowLink href={`/orders/${order.id}`} key={order.id}>
                  <TableCell className="font-medium">
                    {format(new Date(order.createdAt), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]">{order.address}</TableCell>
                  <TableCell>{getStatusBadge(order.status, dict)}</TableCell>
                  <TableCell>
                    {order.paymentStatus === 'entered' ? (
                      <Badge variant="success">{dict.entered}</Badge>
                    ) : (
                      <Badge variant="destructive">{dict.pending}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {order.paymentAmount.toLocaleString()} RUB
                  </TableCell>
                </TableRowLink>
              ))}
              {recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {dict.no_recent_orders}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
