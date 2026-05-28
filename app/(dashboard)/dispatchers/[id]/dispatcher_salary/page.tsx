import React from 'react';
import { db } from '@/lib/db';
import { dispatchers, expenses } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowLeft, Briefcase, DollarSign, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { getDrivers, getDispatchers } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function DispatcherSalaryDetailPage({ params }: { params: { id: string } }) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const dispatcherId = parseInt(params.id);

  if (isNaN(dispatcherId)) return notFound();

  // 1. Fetch dispatcher details
  const [dispatcher] = await db.select().from(dispatchers).where(eq(dispatchers.id, dispatcherId)).limit(1);
  if (!dispatcher) return notFound();

  // 2. Fetch all drivers & dispatchers (for ExpenseForm selector compatibility)
  const [allDrivers, allDispatchers] = await Promise.all([
    getDrivers(),
    getDispatchers(),
  ]);

  // 3. Fetch all salary expenses for this dispatcher
  const dispatcherSalaryExpenses = await db.select().from(expenses)
    .where(eq(expenses.dispatcherId, dispatcherId))
    .orderBy(desc(expenses.recordedAt))
    .then(list => list.filter(e => e.category === 'dispatcher_salary'));

  // Calculate stats
  const totalCost = dispatcherSalaryExpenses.reduce((sum, exp) => sum + exp.amountRub, 0);

  const isUz = dict.fuel !== "Топливо";

  return (
    <div className="space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href="/dashboard/expenses?category=dispatcher_salary">
              <ArrowLeft className="h-4.5 w-4.5 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {dispatcher.name}
            </h1>
            <p className="text-slate-500 mt-1 font-semibold flex items-center gap-2">
              <span>{isUz ? 'Dispetcher oylik va to\'lovlar tarixi' : 'История выплат зарплаты диспетчеру'}</span>
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border border-slate-200">
                <Phone className="h-3 w-3" />
                {dispatcher.phone}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Dispatcher Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Briefcase className="h-32 w-32 text-indigo-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {isUz ? 'Jami to\'lovlar' : 'Всего выплат'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
              {dispatcherSalaryExpenses.length}
              <span className="text-base font-semibold text-slate-500">{isUz ? 'ta' : 'вып.'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">{isUz ? 'Oylik va mukofot to\'lovlari soni' : 'Количество транзакций по зарплате'}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-rose-500/5 to-pink-500/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <DollarSign className="h-32 w-32 text-rose-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              {isUz ? 'Umumiy summa' : 'Общая сумма'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
              {totalCost.toLocaleString()}
              <span className="text-base font-semibold text-slate-500">RUB</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">{isUz ? 'Dispetcherga to\'langan jami mablag\'' : 'Сумма всех выплаченных зарплат'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Full Salary Ledger Ledger Card */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {isUz ? 'Oylik va mukofotlar reestri' : 'Реестр зарплат и выплат'}
          </CardTitle>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {dispatcherSalaryExpenses.length} {isUz ? 'ta yozuv' : 'записей'}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[150px]">{dict.date}</TableHead>
                <TableHead className="w-[120px]">{dict.category}</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right w-[160px]">{dict.amount} (RUB)</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatcherSalaryExpenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-slate-50/30">
                  <TableCell className="text-xs text-slate-500 font-semibold">
                    {format(new Date(exp.recordedAt), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md inline-flex">
                      {dict[exp.category] || exp.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-700">
                    <div className="space-y-1">
                      <div>{exp.note || '-'}</div>
                      {exp.orderId && (
                        <Link 
                          href={`/orders/${exp.orderId}`}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:text-blue-800 px-2 py-0.5 rounded transition-all mt-1 shadow-sm"
                        >
                          📦 {isUz ? 'Buyurtma' : 'Заказ'} #{exp.orderId}
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-indigo-600 font-extrabold">
                    -{exp.amountRub.toLocaleString()} RUB
                  </TableCell>
                  <TableCell className="text-right">
                    <ExpenseForm dict={dict} expense={exp} drivers={allDrivers} dispatchers={allDispatchers} />
                  </TableCell>
                </TableRow>
              ))}
              {dispatcherSalaryExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                    {isUz ? 'Dispetcher oylik to\'lovlari topilmadi.' : 'Записи о зарплатах не найдены.'}
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
