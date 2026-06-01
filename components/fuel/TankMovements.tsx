import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';
import type { TankMovement } from '@/lib/fuel-tank';

function fmtRub(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

/** Combined inbound/outbound feed with type, actor, litres + RUB price. */
export function TankMovements({ items }: { items: TankMovement[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white text-center py-10 text-slate-400 text-sm">
        Движений нет
      </div>
    );
  }

  return (
    <ul className="rounded-2xl border border-slate-200/60 bg-white divide-y divide-slate-100 overflow-hidden">
      {items.map((m) => {
        const isIn = m.type === 'inbound';
        const subjectName = isIn ? m.operatorName : m.driverName;
        const subjectLabel = isIn ? 'оператор' : 'водитель';
        const row = (
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isIn ? <ArrowDownToDot className="h-4 w-4" /> : <ArrowUpFromDot className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">
                  {isIn ? 'Залили в бак' : 'Выдали водителю'}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                    isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {isIn ? '+' : '−'}
                  {Math.round(m.liters).toLocaleString('ru-RU')} L
                </span>
                {!isIn && m.amountRub != null && m.amountRub > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tabular-nums">
                    {fmtRub(m.amountRub)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {subjectName ? (
                  <>
                    <span className="text-slate-400">{subjectLabel}:</span>{' '}
                    <span className="font-bold text-slate-700">{subjectName}</span>
                  </>
                ) : (
                  subjectLabel
                )}
                {m.note ? <span className="text-slate-400"> · {m.note}</span> : null}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap">
              {format(m.recordedAt, 'd MMM, HH:mm', { locale: ru })}
            </span>
          </div>
        );

        // Outbound rows link to the driver detail page when we have a driverId.
        if (!isIn && m.driverId) {
          return (
            <li key={m.id}>
              <Link href={`/drivers/${m.driverId}/fuel`}>{row}</Link>
            </li>
          );
        }
        return <li key={m.id}>{row}</li>;
      })}
    </ul>
  );
}
