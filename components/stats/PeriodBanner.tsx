import React from 'react';
import { Calendar, Database } from 'lucide-react';

/**
 * Compact "what does this page show?" header.
 * Shows ONLY what the user cares about: the period name and the sample size.
 * No "updated at HH:MM" — operators have said that's noise.
 */
export function PeriodBanner({
  periodName,
  periodLabel,
  orderCount,
}: {
  /** Friendly name detected from the URL range, e.g. "Сегодня", "За 7 дней", "За месяц". */
  periodName: string;
  /** Concrete date or range, e.g. "01.06.2026" or "26.05.2026 — 01.06.2026". */
  periodLabel: string;
  orderCount: number;
}) {
  return (
    <div className="ds-fade flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-100/80 ring-1 ring-slate-200 px-3 py-2 text-[12px] sm:text-[13px]">
      <span className="inline-flex items-center gap-1.5 text-slate-700 font-bold">
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="text-slate-900">{periodName}</span>
        <span className="text-slate-400 font-medium">·</span>
        <span className="text-slate-600 font-medium">{periodLabel}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-slate-700 font-bold">
        <Database className="h-4 w-4 text-slate-500" />
        Заказов: <span className="text-slate-900">{orderCount}</span>
      </span>
    </div>
  );
}
