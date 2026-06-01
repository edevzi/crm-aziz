import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { TankDayPoint } from '@/lib/fuel-tank';

function fmt(n: number): string {
  return n === 0 ? '—' : `${Math.round(n).toLocaleString('ru-RU')} L`;
}

function dayName(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
}

/**
 * Daily ledger: per-day inbound / outbound / end-of-day balance.
 * Newest day on top. Bar in the row shows the end-of-day balance against the
 * window's max so trend ('растёт / падает') is visible at a glance.
 */
export function TankDailyHistory({ days, capacityL }: { days: TankDayPoint[]; capacityL: number }) {
  if (!days.length) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white text-center py-10 text-slate-400 text-sm">
        Нет данных за период
      </div>
    );
  }

  const reversed = [...days].reverse();
  const maxBal = Math.max(capacityL, ...reversed.map((d) => d.endOfDayL));

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Дата</TableHead>
              <TableHead className="text-right">Залито</TableHead>
              <TableHead className="text-right">Выдано</TableHead>
              <TableHead>Остаток на конец дня</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reversed.map((d) => {
              const barPct = Math.max(2, (d.endOfDayL / maxBal) * 100);
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              return (
                <TableRow key={d.date}>
                  <TableCell>
                    <div className="font-bold text-slate-800 tabular-nums">{d.label}</div>
                    <div className="text-[11px] text-slate-400">
                      {dayName(d.date)}
                      {isToday && <span className="ml-1 text-emerald-600 font-bold">· сегодня</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {d.inboundL > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold tabular-nums">
                        <ArrowUp className="h-3.5 w-3.5" /> {fmt(d.inboundL)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.outboundL > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold tabular-nums">
                        <ArrowDown className="h-3.5 w-3.5" /> {fmt(d.outboundL)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-[width] duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-sm font-extrabold text-slate-800 tabular-nums whitespace-nowrap min-w-[68px] text-right">
                        {fmt(d.endOfDayL)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
