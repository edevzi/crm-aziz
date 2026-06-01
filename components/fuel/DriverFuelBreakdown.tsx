import React from 'react';
import Link from 'next/link';
import { ChevronRight, Car } from 'lucide-react';
import type { DriverFuelTotal } from '@/lib/fuel-tank';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

function fmtL(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} L`;
}

function fmtRub(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

/**
 * Per-driver fuel offtake from the base tank: litres + RUB total.
 * Bars are scaled against the heaviest taker so the eye picks the top consumer.
 */
export function DriverFuelBreakdown({ drivers }: { drivers: DriverFuelTotal[] }) {
  if (!drivers.length) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white text-center py-10 text-slate-400 text-sm">
        За период никто не заправлялся с базы
      </div>
    );
  }

  const max = Math.max(1, ...drivers.map((d) => d.liters));

  return (
    <ul className="rounded-2xl border border-slate-200/60 bg-white divide-y divide-slate-100 overflow-hidden">
      {drivers.map((d) => {
        const pct = Math.max(4, (d.liters / max) * 100);
        return (
          <li key={d.driverId}>
            <Link
              href={`/drivers/${d.driverId}/fuel`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {initials(d.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate leading-tight">{d.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Car className="h-3 w-3" /> {d.vehiclePlate} · {d.fillCount}× заправок
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col gap-1 min-w-0">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight whitespace-nowrap">
                    {fmtL(d.liters)}
                  </p>
                  <p className="text-[11px] text-rose-600 font-bold tabular-nums whitespace-nowrap">
                    {fmtRub(d.amountRub)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
              </div>

              <div className="col-span-3 sm:hidden">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
