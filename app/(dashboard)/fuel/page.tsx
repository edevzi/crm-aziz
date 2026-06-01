import React from 'react';
import { getDrivers } from '@/lib/data';
import { getDictionary } from '@/lib/dictionaries';
import { FuelForm } from '@/components/forms/FuelForm';
import { GasStationRefillForm } from '@/components/forms/GasStationRefillForm';
import { BaseTankCard } from '@/components/fuel/BaseTankCard';
import { TankDailyHistory } from '@/components/fuel/TankDailyHistory';
import { TankMovements } from '@/components/fuel/TankMovements';
import { DriverFuelBreakdown } from '@/components/fuel/DriverFuelBreakdown';
import {
  getBaseTankSummary,
  getTankDailyHistory,
  getRecentTankMovements,
  getDriverFuelTotals,
} from '@/lib/fuel-tank';

export const dynamic = 'force-dynamic';

export default async function FuelPage() {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);

  const [drivers, tank, days, movements, driverTotals] = await Promise.all([
    getDrivers(),
    getBaseTankSummary(),
    getTankDailyHistory(from, today),
    getRecentTankMovements(15),
    getDriverFuelTotals(from, today),
  ]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Топливо на базе
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Бак на 2 тонны: приход с бензовоза, выдача водителям, остаток.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <GasStationRefillForm dict={dict} />
          <FuelForm dict={dict} drivers={drivers} />
        </div>
      </div>

      {/* 1. Tank state */}
      <BaseTankCard summary={tank} />

      {/* 2. Per-driver breakdown */}
      <section>
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
          Заправки водителей · 14 дней
        </h2>
        <DriverFuelBreakdown drivers={driverTotals} />
      </section>

      {/* 3. Daily ledger + recent movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <section>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
            История по дням · 14 дней
          </h2>
          <TankDailyHistory days={days} capacityL={tank.capacityL} />
        </section>
        <section>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 px-1">
            Последние движения
          </h2>
          <TankMovements items={movements} />
        </section>
      </div>
    </div>
  );
}
