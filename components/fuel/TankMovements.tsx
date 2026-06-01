import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';
import type { TankMovement } from '@/lib/fuel-tank';

/** Combined inbound/outbound feed with explicit type, actor and timestamp. */
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
        return (
          <li key={m.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
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
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {isIn ? '+' : '−'}
                  {Math.round(m.liters).toLocaleString('ru-RU')} L
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {isIn
                  ? m.operatorName
                    ? `оператор: ${m.operatorName}`
                    : 'оператор'
                  : m.driverName
                  ? `водитель: ${m.driverName}`
                  : 'водитель'}
                {m.note ? ` · ${m.note}` : ''}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap">
              {format(m.recordedAt, 'd MMM, HH:mm', { locale: ru })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
