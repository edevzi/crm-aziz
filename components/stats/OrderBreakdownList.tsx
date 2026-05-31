import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatDuration, workSeconds, type OrderTimeline } from '@/lib/driver-stats-compute';
import { StatusTracker } from './StatusTracker';

/** Every order for one driver, each shown as a horizontal step-by-step tracker. */
export function OrderBreakdownList({ timelines }: { timelines: OrderTimeline[] }) {
  if (!timelines.length) {
    return (
      <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm py-10 text-center text-sm text-zinc-400">
        Нет заказов в этом периоде
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {timelines.map((t) => {
        const work = workSeconds(t);
        return (
          <div key={t.orderId} className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-base font-extrabold text-zinc-900">#{t.orderId}</span>
                {t.scheduledAt && (
                  <span className="text-[11px] text-zinc-400 font-mono">{format(t.scheduledAt, 'd MMM, HH:mm', { locale: ru })}</span>
                )}
                {t.completedAt == null && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">в работе</span>
                )}
                {t.dataQuality.missingEvents.length > 0 && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">данные ⚠</span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wide">работа</p>
                <p className="text-sm font-extrabold text-zinc-900 tabular-nums">{formatDuration(work)}</p>
              </div>
            </div>
            <StatusTracker timeline={t} />
          </div>
        );
      })}
    </div>
  );
}
