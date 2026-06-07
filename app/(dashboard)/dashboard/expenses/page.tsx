import React from 'react';
import { getDashboardData, getFinanceData, getDispatchers, getDrivers, getWarehouseData } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Briefcase, Fuel, FileWarning, Recycle, Wrench, CarFront, Tractor, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { MetricCard } from '@/components/MetricCard';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { getCurrentUser } from '@/lib/auth';
import { ExpensesBreakdownPieChart } from '@/components/ExpensesBreakdownPieChart';
import { DriverFuelTracker } from '@/components/DriverFuelTracker';
import { GasStationRefillForm } from '@/components/forms/GasStationRefillForm';
import { DriverGaiTracker } from '@/components/DriverGaiTracker';
import { DriverSalaryTracker } from '@/components/DriverSalaryTracker';
import { ExpensesLineChart } from '@/components/ExpensesLineChart';
import { DriverSparePartsTracker } from '@/components/DriverSparePartsTracker';
import { DriverMasterFeeTracker } from '@/components/DriverMasterFeeTracker';
import { DispatcherSalaryTracker } from '@/components/DispatcherSalaryTracker';
import { DriverUtilizationTracker } from '@/components/DriverUtilizationTracker';

export const dynamic = 'force-dynamic';

export default async function ExpensesDetailPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const [allOrders, { allExpenses, allGasStationInbounds }, user, allDispatchers, allDrivers, { allTransactions }] = await Promise.all([
    getDashboardData(),
    getFinanceData(),
    getCurrentUser(),
    getDispatchers(),
    getDrivers(),
    getWarehouseData()
  ]);
  
  const ordersMap = new Map(allOrders.map(o => [o.id, o]));
  const dispatchersMap = new Map(allDispatchers.map(d => [d.id, d.name]));
  const driversMap = new Map(allDrivers.map(d => [d.id, d]));
  const isOperator = user?.role === 'operator';
  const currentUserId = user?.id;

  // Date Parsing Logic
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const fromParam = searchParams?.from as string;
  const toParam = searchParams?.to as string;
  const categoryParam = searchParams?.category as string;

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
    profit: 0,
    expenses: 0,
    fuel: 0,
    gai: 0,
    utilizationM3: 0,
    spareParts: 0,
    driverSalary: 0,
    dispatcherOrders: 0,
    dispatcherSalary: 0,
    tractor: 0,
    utilizationCost: 0,
    masterFee: 0,
  };

  let prevMetrics = {
    expenses: 0,
    fuel: 0,
    gai: 0,
    utilizationM3: 0,
    spareParts: 0,
    driverSalary: 0,
    dispatcherOrders: 0,
    dispatcherSalary: 0,
    tractor: 0,
    utilizationCost: 0,
    masterFee: 0,
  };

  const filteredExpensesList: any[] = [];

  for (const e of allExpenses) {
    if (isOperator && e.operatorId !== currentUserId) continue;

    const eDate = new Date(e.recordedAt);
    const amt = e.amountRub;
    
    if (isCurrent(eDate)) {
      currentMetrics.expenses += amt;
      if (e.category === 'fuel' || e.category === 'diesel') currentMetrics.fuel += amt;
      if (e.category === 'gai') currentMetrics.gai += amt;
      if (e.category === 'spare_parts') currentMetrics.spareParts += amt;
      if (e.category === 'driver_salary') currentMetrics.driverSalary += amt;
      if (e.category === 'dispatcher_salary') currentMetrics.dispatcherSalary += amt;
      if (e.category === 'tractor') currentMetrics.tractor += amt;
      if (e.category === 'utilization') currentMetrics.utilizationCost += amt;
      if (e.category === 'master_fee') currentMetrics.masterFee += amt;

      if (!categoryParam || categoryParam === 'all' || e.category === categoryParam || (categoryParam === 'fuel' && e.category === 'diesel')) {
        filteredExpensesList.push(e);
      }
    }
    if (isPrev(eDate)) {
      prevMetrics.expenses += amt;
      if (e.category === 'fuel' || e.category === 'diesel') prevMetrics.fuel += amt;
      if (e.category === 'gai') prevMetrics.gai += amt;
      if (e.category === 'spare_parts') prevMetrics.spareParts += amt;
      if (e.category === 'driver_salary') prevMetrics.driverSalary += amt;
      if (e.category === 'dispatcher_salary') prevMetrics.dispatcherSalary += amt;
      if (e.category === 'tractor') prevMetrics.tractor += amt;
      if (e.category === 'utilization') prevMetrics.utilizationCost += amt;
      if (e.category === 'master_fee') prevMetrics.masterFee += amt;
    }
  }

  if (!categoryParam || categoryParam === 'all' || categoryParam === 'fuel' || categoryParam === 'diesel') {
    for (const inbound of allGasStationInbounds || []) {
      if (isOperator && inbound.operatorId !== currentUserId) continue;
      const inboundDate = new Date(inbound.recordedAt);
      if (isCurrent(inboundDate)) {
        filteredExpensesList.push({
          id: `inbound-${inbound.id}`,
          category: 'fuel',
          amountRub: 0,
          note: inbound.note ? `[Пополнение] ${inbound.note}` : '[Пополнение]',
          driverId: null,
          liters: inbound.liters,
          recordedAt: inbound.recordedAt,
          operatorId: inbound.operatorId,
          type: 'inbound'
        });
      }
    }
  }

  for (const order of allOrders) {
    if (isOperator && order.operatorId !== currentUserId) continue;
    const orderDate = new Date(order.createdAt);
    
    if (order.paymentStatus === 'entered' && isCurrent(orderDate)) {
      currentMetrics.revenue += order.paymentAmount;
    }

    if (order.dispatcherId) {
      if (isCurrent(orderDate)) {
        currentMetrics.dispatcherOrders++;
      }
      if (isPrev(orderDate)) {
        prevMetrics.dispatcherOrders++;
      }
    }
  }

  // Свалка (utilization) volume = OUTBOUND warehouse volume (what was actually
  // taken to the dump), not the inbound volume received from orders.
  for (const tx of allTransactions || []) {
    if (tx.type !== 'outbound') continue;
    if (isOperator && tx.operatorId !== currentUserId) continue;
    const txDate = new Date(tx.recordedAt);
    if (isCurrent(txDate)) currentMetrics.utilizationM3 += (tx.volumeM3 || 0);
    if (isPrev(txDate)) prevMetrics.utilizationM3 += (tx.volumeM3 || 0);
  }



  currentMetrics.profit = currentMetrics.revenue - currentMetrics.expenses;

  filteredExpensesList.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const expensesByCategoryData = Object.entries(
    filteredExpensesList.reduce((acc: Record<string, number>, e) => {
      if (isCurrent(new Date(e.recordedAt))) {
        acc[e.category] = (acc[e.category] || 0) + e.amountRub;
      }
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Timeline Data Generation
  const daysDiff = Math.max(1, Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24)));
  const numDays = Math.min(daysDiff, 30); // Cap at 30 days
  const chartDays = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(currentTo.getTime());
    d.setDate(d.getDate() - (numDays - 1) + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const timelineCategories = new Set<string>();
  filteredExpensesList.forEach(e => {
    timelineCategories.add(e.category);
  });
  const timelineCategoriesArray = Array.from(timelineCategories);

  const expensesTimelineData = chartDays.map(date => {
    const dateStr = format(date, 'dd.MM');
    const targetDateStr = format(date, 'yyyy-MM-dd');
    let dataPoint: any = { date: dateStr };
    
    timelineCategoriesArray.forEach(cat => {
      dataPoint[cat] = 0;
    });
    
    filteredExpensesList.forEach(e => {
       const eDate = new Date(e.recordedAt);
       if (format(eDate, 'yyyy-MM-dd') === targetDateStr) {
           dataPoint[e.category] += e.amountRub;
       }
    });
    
    return dataPoint;
  });

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
              {'Детализация расходов'}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {'Распределение расходов по всем категориям'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DashboardDatePicker />
          <ExpenseForm dict={dict} drivers={allDrivers} dispatchers={allDispatchers} />
        </div>
      </div>

      {currentMetrics.expenses > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ExpensesLineChart 
            data={expensesTimelineData} 
            categories={timelineCategoriesArray} 
            dict={dict} 
            lang={lang} 
          />
          <ExpensesBreakdownPieChart 
            expensesByCategory={expensesByCategoryData} 
            dict={dict} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard 
          title={'Диспетчеры'} 
          value={currentMetrics.dispatcherSalary} 
          prevValue={prevMetrics.dispatcherSalary}
          unit="RUB" 
          subText={`${currentMetrics.dispatcherOrders} ${'зак.'}`}
          trend={calcTrend(currentMetrics.dispatcherSalary, prevMetrics.dispatcherSalary)} 
          colorScheme="indigo"
          icon={<Briefcase className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=dispatcher_salary`}
          isActive={categoryParam === 'dispatcher_salary'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.dispatcherSalary / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={dict.fuel || 'Топливо'} 
          value={currentMetrics.fuel} 
          prevValue={prevMetrics.fuel}
          unit="RUB" 
          trend={calcTrend(currentMetrics.fuel, prevMetrics.fuel)} 
          colorScheme="amber"
          icon={<Fuel className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=fuel`}
          isActive={categoryParam === 'fuel'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.fuel / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={dict.gai || 'ГАИ'} 
          value={currentMetrics.gai} 
          prevValue={prevMetrics.gai}
          unit="RUB" 
          trend={calcTrend(currentMetrics.gai, prevMetrics.gai)} 
          colorScheme="rose"
          icon={<FileWarning className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=gai`}
          isActive={categoryParam === 'gai'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.gai / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={'Свалка'} 
          value={currentMetrics.utilizationCost} 
          prevValue={prevMetrics.utilizationCost}
          unit="RUB" 
          subText={`${currentMetrics.utilizationM3} м³`}
          trend={calcTrend(currentMetrics.utilizationCost, prevMetrics.utilizationCost)} 
          colorScheme="purple"
          icon={<Recycle className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=utilization`}
          isActive={categoryParam === 'utilization'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.utilizationCost / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={dict.spare_parts || 'Запчасти'} 
          value={currentMetrics.spareParts} 
          prevValue={prevMetrics.spareParts}
          unit="RUB" 
          trend={calcTrend(currentMetrics.spareParts, prevMetrics.spareParts)} 
          colorScheme="slate"
          icon={<Wrench className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=spare_parts`}
          isActive={categoryParam === 'spare_parts'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.spareParts / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={'Зарплата вод.'} 
          value={currentMetrics.driverSalary} 
          prevValue={prevMetrics.driverSalary}
          unit="RUB" 
          trend={calcTrend(currentMetrics.driverSalary, prevMetrics.driverSalary)} 
          colorScheme="blue"
          icon={<CarFront className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=driver_salary`}
          isActive={categoryParam === 'driver_salary'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.driverSalary / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={dict.tractor || 'Трактор'} 
          value={currentMetrics.tractor} 
          prevValue={prevMetrics.tractor}
          unit="RUB" 
          trend={calcTrend(currentMetrics.tractor, prevMetrics.tractor)} 
          colorScheme="orange"
          icon={<Tractor className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=tractor`}
          isActive={categoryParam === 'tractor'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.tractor / currentMetrics.expenses) * 100) : 0}
        />
        <MetricCard 
          title={dict.master_fee || 'Оплата мастера'} 
          value={currentMetrics.masterFee} 
          prevValue={prevMetrics.masterFee}
          unit="RUB" 
          trend={calcTrend(currentMetrics.masterFee, prevMetrics.masterFee)} 
          colorScheme="amber"
          icon={<HardHat className="w-8 h-8" />}
          href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}&category=master_fee`}
          isActive={categoryParam === 'master_fee'}
          percentageOfTotal={currentMetrics.expenses > 0 ? Math.round((currentMetrics.masterFee / currentMetrics.expenses) * 100) : 0}
        />
        {categoryParam && categoryParam !== 'all' && (
          <Button variant="outline" asChild className="h-full rounded-2xl border-dashed border-2 flex items-center justify-center">
            <Link href={`/dashboard/expenses?from=${fromParam || ''}&to=${toParam || ''}`}>
              {'Показать все'}
            </Link>
          </Button>
        )}
      </div>

      {categoryParam === 'fuel' || categoryParam === 'diesel' ? (
        <div className="space-y-6">
          <div className="flex justify-end mb-2">
            <GasStationRefillForm dict={dict} />
          </div>
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm overflow-hidden relative mt-0">
            <div className="absolute right-0 top-0 text-indigo-100/50 transform translate-x-4 -translate-y-4">
              <Fuel className="w-48 h-48" />
            </div>
            <CardContent className="p-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Fuel className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-wider text-indigo-600/80 uppercase mb-1">
                    Остаток на заправке
                  </p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-4xl font-black text-slate-900">
                      {(
                        (allGasStationInbounds || []).reduce((acc, curr) => acc + curr.liters, 0) -
                        allExpenses.filter(e => e.category === 'fuel' || e.category === 'diesel').reduce((acc, curr) => acc + (curr.liters || 0), 0)
                      ).toLocaleString()} <span className="text-2xl text-slate-500 font-bold">L</span>
                    </h2>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-8 px-6 py-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" /> Всего залито
                  </p>
                  <p className="text-lg font-bold text-slate-800">{(allGasStationInbounds || []).reduce((acc, curr) => acc + curr.liters, 0).toLocaleString()} L</p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-rose-500" /> Всего выдано
                  </p>
                  <p className="text-lg font-bold text-slate-800">{allExpenses.filter(e => e.category === 'fuel' || e.category === 'diesel').reduce((acc, curr) => acc + (curr.liters || 0), 0).toLocaleString()} L</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DriverFuelTracker 
            dict={dict} 
            drivers={allDrivers} 
            expenses={filteredExpensesList.map(e => ({
              ...e,
              category: e.category as 'fuel' | 'diesel'
            }))} 
          />
        </div>
      ) : categoryParam === 'gai' ? (
        <DriverGaiTracker 
          dict={dict} 
          drivers={allDrivers} 
          expenses={filteredExpensesList.map(e => ({
            ...e,
            category: e.category as 'gai'
          }))} 
        />
      ) : categoryParam === 'dispatcher_salary' ? (
        <DispatcherSalaryTracker 
          dict={dict} 
          dispatchers={allDispatchers} 
          expenses={filteredExpensesList.map(e => ({
            ...e,
            category: e.category as 'dispatcher_salary'
          }))} 
        />
      ) : categoryParam === 'driver_salary' ? (
        <DriverSalaryTracker 
          dict={dict} 
          drivers={allDrivers} 
          expenses={filteredExpensesList.map(e => ({
            ...e,
            category: e.category as 'driver_salary'
          }))} 
        />
      ) : categoryParam === 'spare_parts' ? (
        <DriverSparePartsTracker 
          dict={dict} 
          drivers={allDrivers} 
          expenses={filteredExpensesList.map(e => ({
            ...e,
            category: e.category as 'spare_parts'
          }))} 
        />
      ) : categoryParam === 'master_fee' ? (
        <DriverMasterFeeTracker 
          dict={dict} 
          drivers={allDrivers} 
          expenses={filteredExpensesList.map(e => ({
            ...e,
            category: e.category as 'master_fee'
          }))} 
        />
      ) : categoryParam === 'utilization' ? (
        <DriverUtilizationTracker 
          dict={dict} 
          drivers={allDrivers} 
          expenses={filteredExpensesList.map(e => ({
            ...e,
            category: e.category as 'utilization'
          }))} 
        />
      ) : (
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {categoryParam && categoryParam !== 'all' ? (dict[categoryParam as keyof typeof dict] || categoryParam) : dict.expense_ledger || dict.recent_expenses}
            </CardTitle>
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredExpensesList.length} {'записей'}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>{dict.date}</TableHead>
                  <TableHead>{dict.category}</TableHead>
                  <TableHead>{dict.note}</TableHead>
                  <TableHead className="text-right">{dict.amount}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpensesList.slice(0, 100).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs text-slate-500">{format(new Date(expense.recordedAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md inline-flex">
                        {expense.category === 'dispatcher_salary' && expense.orderId && ordersMap.get(expense.orderId)?.dispatcherId
                          ? dispatchersMap.get(ordersMap.get(expense.orderId)!.dispatcherId!) || dict.dispatcher_salary
                          : (dict[expense.category as keyof typeof dict] || expense.category.replace('_', ' '))}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {expense.orderId ? (
                        <Link href={`/orders/${expense.orderId}`} className="text-blue-600 hover:underline">
                          {expense.note || `Заказ #${expense.orderId}`}
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-700">{expense.note || '-'}</span>
                          {(expense.driverId || expense.liters) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {expense.driverId && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">
                                  <CarFront className="h-3 w-3 text-slate-400" />
                                  {driversMap.get(expense.driverId)?.name || 'Водитель'}
                                </span>
                              )}
                              {expense.liters && (
                                <span className={expense.category === 'utilization' 
                                  ? "inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-100"
                                  : "inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-100"}>
                                  {expense.category === 'utilization' ? <Recycle className="h-3 w-3 text-indigo-500" /> : <Fuel className="h-3 w-3 text-amber-500" />}
                                  {expense.liters} {expense.category === 'utilization' ? 'м³' : 'L'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-rose-600 font-extrabold">-{expense.amountRub.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <ExpenseForm dict={dict} expense={expense} drivers={allDrivers} dispatchers={allDispatchers} />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpensesList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                      {"Расходы не найдены."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
