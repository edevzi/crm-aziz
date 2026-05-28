import React from 'react';
import { getDrivers } from '@/lib/data';
import { db } from '@/lib/db';
import { expenses, gasStationInbounds } from '@/lib/schema';
import { inArray, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { getCurrentUser } from '@/lib/auth';
import { FuelForm } from '@/components/forms/FuelForm';
import { GasStationRefillForm } from '@/components/forms/GasStationRefillForm';
import { DriverFuelTracker } from '@/components/DriverFuelTracker';
import { Card, CardContent } from '@/components/ui/card';
import { Fuel, TrendingDown, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FuelPage() {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const user = await getCurrentUser();
  const isOperator = user?.role === 'operator';

  // 1. Fetch drivers
  const drivers = await getDrivers();

  // 2. Fetch fuel & diesel expenses directly
  let rawExpenses = await db.select({
    id: expenses.id,
    category: expenses.category,
    amountRub: expenses.amountRub,
    note: expenses.note,
    driverId: expenses.driverId,
    liters: expenses.liters,
    recordedAt: expenses.recordedAt,
    operatorId: expenses.operatorId,
  })
  .from(expenses)
  .where(inArray(expenses.category, ['fuel', 'diesel']))
  .orderBy(desc(expenses.recordedAt));

  // 3. Fetch gas station inbounds
  const inbounds = await db.select().from(gasStationInbounds);

  // Apply operator restriction if applicable
  if (isOperator && user) {
    rawExpenses = rawExpenses.filter(e => e.operatorId === user.id);
  }

  // Calculate Gas Station Balance
  const totalInboundLiters = inbounds.reduce((acc, curr) => acc + curr.liters, 0);
  const totalOutboundLiters = rawExpenses.reduce((acc, curr) => acc + (curr.liters || 0), 0);
  const currentBalance = totalInboundLiters - totalOutboundLiters;

  // Cast categories correctly for frontend component
  const fuelExpenses = rawExpenses.map(e => ({
    ...e,
    category: e.category as 'fuel' | 'diesel'
  }));

  return (
    <div className="space-y-8">
      {/* Header View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {dict.fuel_logs || 'Учет Топлива'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {dict.monitor_fuel || 'Мониторинг расхода топлива и остаток собственной заправки.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <GasStationRefillForm dict={dict} />
          <FuelForm dict={dict} drivers={drivers} />
        </div>
      </div>

      {/* Gas Station Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-3 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm overflow-hidden relative">
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
                    {currentBalance.toLocaleString()} <span className="text-2xl text-slate-500 font-bold">L</span>
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="flex gap-8 px-6 py-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" /> Всего залито
                </p>
                <p className="text-lg font-bold text-slate-800">{totalInboundLiters.toLocaleString()} L</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-rose-500" /> Всего выдано
                </p>
                <p className="text-lg font-bold text-slate-800">{totalOutboundLiters.toLocaleString()} L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Fuel Tracker Component */}
      <DriverFuelTracker 
        dict={dict} 
        drivers={drivers} 
        expenses={fuelExpenses} 
      />
    </div>
  );
}
