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
import { BaseTankCard } from '@/components/fuel/BaseTankCard';
import { TankDailyHistory } from '@/components/fuel/TankDailyHistory';
import { TankMovements } from '@/components/fuel/TankMovements';
import { DriverFuelBreakdown } from '@/components/fuel/DriverFuelBreakdown';
import { getBaseTankSummary, getTankDailyHistory, getRecentTankMovements, getDriverFuelTotals, BASE_TANK_CAPACITY_L } from '@/lib/fuel-tank';

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

  // Apply operator restriction if applicable
  if (isOperator && user) {
    rawExpenses = rawExpenses.filter(e => e.operatorId === user.id);
  }

  // Cast categories correctly for frontend component
  const fuelExpenses = rawExpenses.map(e => ({
    ...e,
    category: e.category as 'fuel' | 'diesel'
  }));

  // Tank data — current balance, daily history (14 days back), recent movements
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);
  const [tank, days, movements, driverTotals] = await Promise.all([
    getBaseTankSummary(),
    getTankDailyHistory(from, today),
    getRecentTankMovements(15),
    getDriverFuelTotals(from, today),
  ]);

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

      {/* Visual tank — 2 ton capacity */}
      <BaseTankCard summary={tank} />

      {/* Per-driver breakdown — who took how much fuel and what it cost */}
      <div>
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
          По водителям · 14 дней
        </h2>
        <DriverFuelBreakdown drivers={driverTotals} />
      </div>

      {/* Daily ledger + recent movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
            История по дням · 14 дней
          </h2>
          <TankDailyHistory days={days} capacityL={tank.capacityL} />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
            Последние движения
          </h2>
          <TankMovements items={movements} />
        </div>
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
