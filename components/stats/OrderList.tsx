import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle2, Circle, Truck, PackagePlus, Recycle, FilePlus2 } from 'lucide-react';
import { formatDuration, type OrderTimeline } from '@/lib/driver-stats-compute';

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  new: { label: 'Новый', cls: 'bg-slate-100 text-slate-600', icon: FilePlus2 },
  assigned: { label: 'Принят', cls: 'bg-violet-100 text-violet-700', icon: CheckCircle2 },
  in_progress: { label: 'В пути', cls: 'bg-sky-100 text-sky-700', icon: Truck },
  container_placed: { label: 'Поставлен', cls: 'bg-teal-100 text-teal-700', icon: PackagePlus },
  picked_up: { label: 'Забран', cls: 'bg-fuchsia-100 text-fuchsia-700', icon: Recycle },
  completed: { label: 'Завершён', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

/** Lifecycle progress 0..1 */
function progress(t: OrderTimeline): number {
  if (t.completedAt) return 1;
  if (t.pickedUpAt) return 0.83;
  if (t.containerPlacedAt) return 0.66;
  if (t.inProgressAt) return 0.5;
  if (t.assignedAt) return 0.33;
  if (t.viewedAt) return 0.16;
  return 0.05;
}

/**
 * Compact row per order — status pill, progress bar showing how far through the
 * lifecycle, total time so far, scheduled date. Click → full timeline below.
 * Designed to scan many orders quickly without reading any sentence.
 */
export function OrderList({
  orders,
  emptyMessage,
}: {
  orders: OrderTimeline[];
  emptyMessage?: string;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white text-center py-10 text-slate-400 text-sm">
        {emptyMessage ?? 'Нет заказов'}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/60 overflow-hidden">
      {orders.map((o) => {
        const m = STATUS_META[o.status] ?? STATUS_META.new;
        const Icon = m.icon;
        const pct = Math.round(progress(o) * 100);
        const total = o.durations.total ?? null;
        return (
          <li key={o.orderId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${m.cls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">#{o.orderId}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${m.cls}`}>{m.label}</span>
                {o.scheduledAt && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {format(o.scheduledAt, 'd MMM, HH:mm', { locale: ru })}
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${o.completedAt ? 'bg-emerald-500' : 'bg-sky-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {(o.address || o.clientName) && (
                <p className="mt-1 text-[11px] text-slate-500 truncate">
                  {o.clientName ?? ''}{o.clientName && o.address ? ' · ' : ''}{o.address ?? ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                {total != null ? formatDuration(total) : '—'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{o.completedAt ? 'итого' : 'идёт'}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
