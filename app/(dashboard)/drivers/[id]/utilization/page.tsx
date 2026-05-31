import React from 'react';
import { db } from '@/lib/db';
import { drivers, expenses } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowLeft, Car, Recycle, DollarSign, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getDrivers } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function DriverUtilizationDetailPage({ params }: { params: { id: string } }) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const driverId = parseInt(params.id);

  if (isNaN(driverId)) return notFound();

  // 1. Fetch driver details
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!driver) return notFound();

  // 2. Fetch all drivers (for Form selector compatibility if needed)
  const allDrivers = await getDrivers();

  // 3. Fetch all utilization expenses for this driver
  const driverUtilizationExpenses = await db.select().from(expenses)
    .where(eq(expenses.driverId, driverId))
    .orderBy(desc(expenses.recordedAt))
    .then(list => list.filter(e => e.category === 'utilization'));

  // Calculate aggregated stats
  const totalM3 = driverUtilizationExpenses.reduce((sum, exp) => sum + (exp.liters || 0), 0);
  const totalCost = driverUtilizationExpenses.reduce((sum, exp) => sum + exp.amountRub, 0);

  return (
    <div className="space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href="/utilization">
              <ArrowLeft className="h-4.5 w-4.5 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {driver.name}
            </h1>
            <p className="text-slate-500 mt-1 font-semibold flex items-center gap-2">
              <span>История свалки</span>
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border border-slate-200">
                <Car className="h-3 w-3" />
                {driver.vehiclePlate}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Driver Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <Recycle className="h-32 w-32 text-indigo-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Recycle className="h-4 w-4" />
              Объем свалки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
              {totalM3.toLocaleString()}
              <span className="text-base font-semibold text-slate-500">м³</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Общий объем мусора</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-rose-500/5 to-pink-500/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <DollarSign className="h-32 w-32 text-rose-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Затраты на свалку
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
              {totalCost.toLocaleString()}
              <span className="text-base font-semibold text-slate-500">RUB</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Общие финансовые расходы</p>
          </CardContent>
        </Card>
      </div>

      {/* Full Utilization Ledger Card */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Полный реестр свалки
          </CardTitle>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {driverUtilizationExpenses.length} записей
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[150px]">{dict.date}</TableHead>
                <TableHead className="w-[120px]">{dict.category}</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right w-[120px]">Объем</TableHead>
                <TableHead className="text-right w-[160px]">{dict.amount} (RUB)</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverUtilizationExpenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-slate-50/30">
                  <TableCell className="text-xs text-slate-500 font-semibold">
                    {format(new Date(exp.recordedAt), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md inline-flex">
                      Свалка
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-700">
                    {exp.note || '-'}
                  </TableCell>
                  <TableCell className="text-right text-xs font-extrabold text-slate-800">
                    {exp.liters ? `${exp.liters} м³` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-red-600 font-extrabold">
                    -{exp.amountRub.toLocaleString()} RUB
                  </TableCell>
                  <TableCell className="text-right">
                  </TableCell>
                </TableRow>
              ))}
              {driverUtilizationExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                    Записи о расходах на свалку не найдены.
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
