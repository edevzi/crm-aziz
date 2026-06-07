import React, { Suspense } from 'react';
import { getFinanceData, getClients, getDispatchers, getDashboardData, getDrivers, getSafeData, getWarehouseData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { getDictionary } from '@/lib/dictionaries';
import { Wallet, ArrowUpRight, ArrowDownRight, Percent, Briefcase, Fuel, FileWarning, Recycle, Wrench, CarFront, Tractor } from 'lucide-react';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { FinanceCharts } from '@/components/FinanceCharts';
import { ExportButton } from '@/components/ExportButton';
import { FinanceFilter } from '@/components/FinanceFilter';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { MetricCard } from '@/components/MetricCard';
import { ExpenseLedgerTable } from '@/components/tables/ExpenseLedgerTable';
import { IncomeLedgerTable } from '@/components/tables/IncomeLedgerTable';
import { getCurrentUser } from '@/lib/auth';
import FinanceLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  // Quick metadata for static forms & header shell
  const [allDrivers, allDispatchers, user] = await Promise.all([
    getDrivers(),
    getDispatchers(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.finance}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.track_finance}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end sm:items-center">
          <DashboardDatePicker />
          <ExpenseForm dict={dict} drivers={allDrivers} dispatchers={allDispatchers} />
        </div>
      </div>

      <Suspense key={JSON.stringify(searchParams)} fallback={<FinanceLoading />}>
        <FinancePageContent 
          searchParams={searchParams} 
          dict={dict} 
          lang={lang} 
          allDrivers={allDrivers}
          allDispatchers={allDispatchers}
          user={user}
        />
      </Suspense>
    </div>
  );
}

async function FinancePageContent({
  searchParams,
  dict,
  lang,
  allDrivers,
  allDispatchers,
  user,
}: {
  searchParams: { [key: string]: string | string[] | undefined },
  dict: any,
  lang: string,
  allDrivers: any[],
  allDispatchers: any[],
  user: any,
}) {
  const [allOrders, { allExpenses }, allClients, safeData, { allTransactions }] = await Promise.all([
    getDashboardData(),
    getFinanceData(),
    getClients(),
    getSafeData(),
    getWarehouseData()
  ]);

  const ordersMap = new Map(allOrders.map(o => [o.id, o]));
  const dispatchersMap = new Map(allDispatchers.map(d => [d.id, d.name]));
  const clientMap = new Map(allClients.map(c => [c.id, c]));

  const isOperator = user?.role === 'operator';
  const currentUserId = user?.id;

  // Read search & filter parameters
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'expenses';
  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : '';
  const sourceFilter = typeof searchParams.source === 'string' ? searchParams.source : '';
  const startDateStr = typeof searchParams.from === 'string' ? searchParams.from : '';
  const endDateStr = typeof searchParams.to === 'string' ? searchParams.to : '';

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  let startDate = startDateStr ? new Date(startDateStr) : new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  let endDate = endDateStr ? new Date(endDateStr) : new Date(todayDate.getTime());

  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(23, 59, 59, 999);

  const isFiltered = !!(q || (currentTab === 'expenses' && categoryFilter && categoryFilter !== 'all') || (currentTab === 'income' && sourceFilter && sourceFilter !== 'all') || startDateStr || endDateStr);

  // ================= EXPENSES SECTION =================
  let filteredExpenses = allExpenses;

  if (isOperator) {
    filteredExpenses = filteredExpenses.filter(e => e.operatorId === currentUserId);
  }

  if (categoryFilter && categoryFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
  }
  if (q) {
    filteredExpenses = filteredExpenses.filter(e =>
      e.note?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (dict[e.category as keyof typeof dict]?.toLowerCase() || '').includes(q)
    );
  }
  if (startDate) {
    filteredExpenses = filteredExpenses.filter(e => new Date(e.recordedAt) >= startDate);
  }
  if (endDate) {
    filteredExpenses = filteredExpenses.filter(e => new Date(e.recordedAt) <= endDate);
  }

  // Calculate overall & filtered expenses totals
  let overallTotalExpenses = 0;
  allExpenses.forEach(e => {
    overallTotalExpenses += e.amountRub;
  });

  let filteredTotalExpenses = 0;
  const filteredExpensesByCategory: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    filteredTotalExpenses += e.amountRub;
    if (!filteredExpensesByCategory[e.category]) {
      filteredExpensesByCategory[e.category] = 0;
    }
    filteredExpensesByCategory[e.category] += e.amountRub;
  });

  const chartExpensesByCategory = Object.entries(filteredExpensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // ================= INCOME SECTION =================
  interface IncomeItem {
    id: string;
    type: 'order' | 'warehouse';
    rawId: number;
    date: Date;
    amount: number;
    sourceKey: 'client_payment' | string;
    sourceLabel: string;
    clientName?: string;
    note: string;
    address?: string;
  }

  const combinedIncomes: IncomeItem[] = [];

  allOrders.forEach(o => {
    if (o.paymentStatus === 'entered' && (!isOperator || o.operatorId === currentUserId)) {
      const client = o.isExternalVehicle ? null : clientMap.get(o.clientId!);
      combinedIncomes.push({
        id: `order-${o.id}`,
        type: 'order',
        rawId: o.id,
        // Income is recognised on the date the payment was entered (closedAt),
        // falling back to createdAt for legacy orders not yet stamped.
        date: o.closedAt ? new Date(o.closedAt) : new Date(o.createdAt),
        amount: o.paymentAmount,
        sourceKey: o.isExternalVehicle ? 'external_vehicle_rental' : 'client_payment',
        sourceLabel: o.isExternalVehicle
          ? ('Сторонняя машина')
          : dict.client_payment,
        clientName: o.isExternalVehicle
          ? (o.externalDriverName || ('Сторонний водитель'))
          : (client?.name || dict.client),
        note: o.operatorNote || '',
        address: o.isExternalVehicle ? 'База' : o.address
      });
    }
  });

  safeData.forEach(s => {
    if (s.transaction.type === 'expense' && (!isOperator || s.transaction.operatorId === currentUserId)) {
      combinedIncomes.push({
        id: `safe-expense-${s.transaction.id}`,
        type: 'warehouse',
        rawId: s.transaction.id,
        date: new Date(s.transaction.recordedAt),
        amount: -s.transaction.amountRub,
        sourceKey: 'safe_expense',
        sourceLabel: dict.safe_expense || 'Расход сейфа',
        clientName: s.operator?.name || 'Оператор',
        note: s.transaction.note || 'Расход из сейфа',
        address: 'Сейф'
      });
    }
  });

  combinedIncomes.sort((a, b) => b.date.getTime() - a.date.getTime());

  let filteredIncomes = combinedIncomes;

  if (sourceFilter && sourceFilter !== 'all') {
    filteredIncomes = filteredIncomes.filter(i => i.sourceKey === sourceFilter);
  }
  if (q) {
    filteredIncomes = filteredIncomes.filter(i =>
      i.note.toLowerCase().includes(q) ||
      (i.clientName?.toLowerCase() || '').includes(q) ||
      (i.address?.toLowerCase() || '').includes(q) ||
      i.sourceLabel.toLowerCase().includes(q) ||
      (dict[i.sourceKey as keyof typeof dict]?.toLowerCase() || '').includes(q)
    );
  }
  if (startDate) {
    filteredIncomes = filteredIncomes.filter(i => i.date >= startDate);
  }
  if (endDate) {
    filteredIncomes = filteredIncomes.filter(i => i.date <= endDate);
  }

  let overallTotalIncome = 0;
  combinedIncomes.forEach(i => {
    overallTotalIncome += i.amount;
  });

  let filteredTotalIncome = 0;
  const filteredIncomeBySource: Record<string, number> = {};
  filteredIncomes.forEach(i => {
    filteredTotalIncome += i.amount;
    const srcLabel = i.sourceLabel;
    if (!filteredIncomeBySource[srcLabel]) {
      filteredIncomeBySource[srcLabel] = 0;
    }
    filteredIncomeBySource[srcLabel] += i.amount;
  });

  // ================= GENERAL METRICS =================
  const overallNetProfit = overallTotalIncome - overallTotalExpenses;
  const filteredNetProfit = filteredTotalIncome - filteredTotalExpenses;

  const parseLocal = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0, 0);
  };

  const currentFrom = startDateStr ? parseLocal(startDateStr) : new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const currentTo = endDateStr ? parseLocal(endDateStr) : new Date(todayDate.getTime());
  currentTo.setHours(23, 59, 59, 999);

  const durationMs = currentTo.getTime() - currentFrom.getTime();

  const prevTo = new Date(currentFrom.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  prevFrom.setHours(0, 0, 0, 0);
  prevTo.setHours(23, 59, 59, 999);

  const isCurrent = (d: Date) => d >= currentFrom && d <= currentTo;
  const isPrev = (d: Date) => d >= prevFrom && d <= prevTo;

  let currentMetrics = {
    dispatcherOrders: 0, fuel: 0, gai: 0, utilizationM3: 0, spareParts: 0, driverSalary: 0, tractor: 0
  };
  let prevMetrics = {
    dispatcherOrders: 0, fuel: 0, gai: 0, utilizationM3: 0, spareParts: 0, driverSalary: 0, tractor: 0
  };

  for (const order of allOrders) {
    if (isOperator && order.operatorId !== currentUserId) continue;
    const orderDate = new Date(order.createdAt);
    if (order.dispatcherId) {
      if (isCurrent(orderDate)) currentMetrics.dispatcherOrders++;
      if (isPrev(orderDate)) prevMetrics.dispatcherOrders++;
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

  for (const e of allExpenses) {
    if (isOperator && e.operatorId !== currentUserId) continue;
    const eDate = new Date(e.recordedAt);
    const amt = e.amountRub;
    if (isCurrent(eDate)) {
      if (e.category === 'fuel' || e.category === 'diesel') currentMetrics.fuel += amt;
      if (e.category === 'gai') currentMetrics.gai += amt;
      if (e.category === 'spare_parts') currentMetrics.spareParts += amt;
      if (e.category === 'driver_salary') currentMetrics.driverSalary += amt;
      if (e.category === 'tractor') currentMetrics.tractor += amt;
    }
    if (isPrev(eDate)) {
      if (e.category === 'fuel' || e.category === 'diesel') prevMetrics.fuel += amt;
      if (e.category === 'gai') prevMetrics.gai += amt;
      if (e.category === 'spare_parts') prevMetrics.spareParts += amt;
      if (e.category === 'driver_salary') prevMetrics.driverSalary += amt;
      if (e.category === 'tractor') prevMetrics.tractor += amt;
    }
  }

  // ================= CHARTS DATA (All-Time Monthly) =================
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const chartMonthlyData = last6Months.map(date => {
    const monthStr = format(date, 'MMM');
    let income = 0;
    let expenses = 0;

    allOrders.forEach(order => {
      if (isOperator && order.operatorId !== currentUserId) return;
      const revDate = order.closedAt ? new Date(order.closedAt) : new Date(order.createdAt);
      if (revDate.getMonth() === date.getMonth() && revDate.getFullYear() === date.getFullYear() && order.paymentStatus === 'entered') {
        income += order.paymentAmount;
      }
    });

    safeData.forEach(s => {
      if (isOperator && s.transaction.operatorId !== currentUserId) return;
      const sDate = new Date(s.transaction.recordedAt);
      if (sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear() && s.transaction.type === 'expense') {
        income -= s.transaction.amountRub;
      }
    });

    allExpenses.forEach(e => {
      if (isOperator && e.operatorId !== currentUserId) return;
      const eDate = new Date(e.recordedAt);
      if (eDate.getMonth() === date.getMonth() && eDate.getFullYear() === date.getFullYear()) {
        expenses += e.amountRub;
      }
    });

    return { month: monthStr, income, expenses };
  });

  // ================= EXPORTS DATA =================
  const exportExpensesData = filteredExpenses.map(e => ({
    id: `#${e.id}`,
    category: dict[e.category as keyof typeof dict] || e.category,
    note: e.note || '-',
    date: format(new Date(e.recordedAt), 'dd.MM.yyyy'),
    amount: `${e.amountRub.toLocaleString()} RUB`
  }));

  const exportExpensesColumns = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: dict.category },
    { key: 'note', label: dict.note },
    { key: 'date', label: dict.date },
    { key: 'amount', label: dict.amount }
  ];

  const exportIncomesData = filteredIncomes.map(i => ({
    id: i.type === 'order' ? `#Buyurtma-${i.rawId}` : `#Ombor-${i.rawId}`,
    source: i.sourceLabel,
    details: i.type === 'order'
      ? `${i.clientName} (${i.address || ''})`
      : (i.note || '-'),
    date: format(i.date, 'dd.MM.yyyy'),
    amount: `${i.amount.toLocaleString()} RUB`
  }));

  const exportIncomesColumns = [
    { key: 'id', label: 'ID' },
    { key: 'source', label: dict.income_source || 'Manba' },
    { key: 'details', label: dict.details || 'Batafsil' },
    { key: 'date', label: dict.date },
    { key: 'amount', label: dict.amount }
  ];

  const expenseCategories = [
    { value: 'fuel', label: dict.fuel || 'Топливо' },
    { value: 'diesel', label: dict.diesel || 'Дизель' },
    { value: 'spare_parts', label: dict.spare_parts || 'Запчасти' },
    { value: 'repair', label: dict.repair || 'Ремонт' },
    { value: 'utilization', label: dict.utilization || 'Утилизация' },
    { value: 'base_rent', label: dict.base_rent || 'Аренда базы' },
    { value: 'gai', label: dict.gai || 'ГАИ' },
    { value: 'driver_salary', label: dict.driver_salary || 'Зарплата водителя' },
    { value: 'worker_salary', label: dict.worker_salary || 'Зарплата рабочего' },
    { value: 'dispatcher_salary', label: dict.dispatcher_salary || 'Зарплата диспетчера' },
    { value: 'referral_fee', label: dict.referral_fee || 'Реферальные' },
    { value: 'master_fee', label: dict.master_fee || 'Мастер' },
    { value: 'tractor', label: dict.tractor || 'Трактор' },
    { value: 'other', label: dict.other || 'Другое' }
  ];

  const incomeSources = [
    { value: 'client_payment', label: dict.client_payment || 'Оплата клиента' },
    { value: 'external_vehicle_rental', label: dict.external_vehicle_rental || 'Аренда стороннего авто' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end -mb-4">
        <ExportButton
          data={currentTab === 'expenses' ? exportExpensesData : exportIncomesData}
          columns={currentTab === 'expenses' ? exportExpensesColumns : exportIncomesColumns}
          filename={currentTab === 'expenses' ? "expenses_report" : "income_report"}
          title={
            currentTab === 'expenses'
              ? ("Список расходов")
              : ("Список доходов")
          }
          dict={dict}
        />
      </div>

      {/* Summary Cards with Filter Awareness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <Card className="border-0 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-600">
            <ArrowUpRight className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {dict.total_income} {isFiltered && `(${dict.filtered_total?.toLowerCase()})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
              {filteredTotalIncome.toLocaleString()}{' '}
              <span className="text-lg sm:text-xl font-semibold opacity-70">RUB</span>
            </div>
            {isFiltered && (
              <p className="text-xs font-semibold text-emerald-700/60 mt-1">
                {`Всего (all-time): ${overallTotalIncome.toLocaleString()} RUB`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-0 shadow-lg shadow-rose-500/10 ring-1 ring-rose-100 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-rose-600">
            <ArrowDownRight className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              {dict.total_expenses} {isFiltered && `(${dict.filtered_total?.toLowerCase()})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
              {filteredTotalExpenses.toLocaleString()}{' '}
              <span className="text-lg sm:text-xl font-semibold opacity-70">RUB</span>
            </div>
            {isFiltered && (
              <p className="text-xs font-semibold text-rose-700/60 mt-1">
                {`Всего (all-time): ${overallTotalExpenses.toLocaleString()} RUB`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={`border-0 shadow-lg ring-1 rounded-3xl overflow-hidden relative ${filteredNetProfit >= 0 ? "shadow-blue-500/10 ring-blue-100 bg-gradient-to-br from-blue-50 to-white" : "shadow-orange-500/10 ring-orange-100 bg-gradient-to-br from-orange-50 to-white"}`}>
          <div className={`absolute top-0 right-0 p-6 opacity-10 ${filteredNetProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            <Percent className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className={`text-xs font-bold uppercase tracking-wider ${filteredNetProfit >= 0 ? "text-blue-800" : "text-orange-800"}`}>
              {dict.net_profit} {isFiltered && `(${dict.filtered_total?.toLowerCase()})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${filteredNetProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {filteredNetProfit.toLocaleString()}{' '}
              <span className="text-lg sm:text-xl font-semibold opacity-70">RUB</span>
            </div>
            {isFiltered && (
              <p className={`text-xs font-semibold mt-1 ${filteredNetProfit >= 0 ? "text-blue-700/60" : "text-orange-700/60"}`}>
                {`Всего (all-time): ${overallNetProfit.toLocaleString()} RUB`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finance Charts */}
      <FinanceCharts
        monthlyData={chartMonthlyData}
        expensesByCategory={chartExpensesByCategory}
        dict={dict}
      />

      {/* Filters Area */}
      <div className="pt-4">
        <FinanceFilter
          dict={dict}
          expenseCategories={expenseCategories}
          incomeSources={incomeSources}
        />
      </div>

      {/* Dynamic Ledgers Section depending on tab */}
      {currentTab === 'expenses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenses Breakdown */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{dict.expenses_breakdown}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>{dict.category}</TableHead>
                    <TableHead className="text-right">{dict.amount} (RUB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(filteredExpensesByCategory).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell className="capitalize font-semibold text-slate-700">
                        {dict[category as keyof typeof dict] || category.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(filteredExpensesByCategory).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-500 font-medium">
                        {"Нет данных о распределении расходов."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{dict.expense_ledger || dict.recent_expenses}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <ExpenseLedgerTable 
                expenses={filteredExpenses.map(expense => {
                  let resolvedCategoryLabel = dict[expense.category as keyof typeof dict] || expense.category.replace('_', ' ');
                  if (expense.category === 'dispatcher_salary' && expense.orderId) {
                    const order = ordersMap.get(expense.orderId);
                    if (order && order.dispatcherId) {
                      resolvedCategoryLabel = dispatchersMap.get(order.dispatcherId) || dict.dispatcher_salary;
                    }
                  }
                  return { ...expense, resolvedCategoryLabel };
                })} 
                dict={dict} 
                allDrivers={allDrivers} 
                allDispatchers={allDispatchers} 
                lang={lang} 
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{"Распределение доходов по источникам"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>{dict.source || "Manba"}</TableHead>
                    <TableHead className="text-right">{dict.amount} (RUB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(filteredIncomeBySource).sort((a, b) => b[1] - a[1]).map(([source, amount]) => (
                    <TableRow key={source}>
                      <TableCell className="capitalize font-semibold text-slate-700">
                        {source}
                      </TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(filteredIncomeBySource).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-500 font-medium">
                        {"Нет данных о распределении доходов."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Income List */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{dict.income_ledger || "Daromadlar daftari"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <IncomeLedgerTable incomes={filteredIncomes} dict={dict} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
