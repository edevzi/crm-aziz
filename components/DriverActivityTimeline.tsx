import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FilePlus2, Eye, CheckCircle2, Truck, PackagePlus, Recycle, Flag } from 'lucide-react';
import { formatDuration, type OrderTimeline } from '@/lib/driver-stats-compute';
import { stageQuality, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const NODES: { event: string; label: string; key: keyof OrderTimeline; icon: any; bg: string; text: string }[] = [
  { event: 'created', label: 'Заказ создан', key: 'createdAt', icon: FilePlus2, bg: 'bg-slate-100', text: 'text-slate-500' },
  { event: 'viewed', label: 'Открыл в приложении', key: 'viewedAt', icon: Eye, bg: 'bg-sky-100', text: 'text-sky-700' },
  { event: 'assigned', label: 'Принял заказ', key: 'assignedAt', icon: CheckCircle2, bg: 'bg-violet-100', text: 'text-violet-700' },
  { event: 'in_progress', label: 'Выехал', key: 'inProgressAt', icon: Truck, bg: 'bg-sky-100', text: 'text-sky-700' },
  { event: 'container_placed', label: 'Поставил контейнер', key: 'containerPlacedAt', icon: PackagePlus, bg: 'bg-teal-100', text: 'text-teal-700' },
  { event: 'picked_up', label: 'Забрал контейнер', key: 'pickedUpAt', icon: Recycle, bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { event: 'completed', label: 'Завершил заказ', key: 'completedAt', icon: Flag, bg: 'bg-emerald-100', text: 'text-emerald-700' },
];

const TO_STAGE: Record<string, StageKey | undefined> = {
  assigned: 'approve',
  in_progress: 'start',
  container_placed: 'place',
  picked_up: 'pickup',
  completed: 'complete',
};

const QGAP: Record<Quality, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  ok: 'bg-amber-50 text-amber-700 ring-amber-100',
  slow: 'bg-rose-50 text-rose-700 ring-rose-100',
  neutral: 'bg-slate-50 text-slate-500 ring-slate-200',
};

/** Single-order replay — confirmed clear by the user. Kept lean. */
function OrderRow({ t }: { t: OrderTimeline }) {
  const present = NODES.map((n) => ({ ...n, time: t[n.key] as Date | null })).filter((n) => n.time);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <p className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">#{t.orderId}</p>
          {t.scheduledAt && (
            <p className="text-[11px] text-slate-400 font-medium tabular-nums mt-0.5">
              план {format(t.scheduledAt, 'd MMM, HH:mm', { locale: ru })}
            </p>
          )}
        </div>
        {t.durations.total != null && (
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Время выполнения</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-600 tabular-nums leading-tight mt-1">
              {formatDuration(t.durations.total)}
            </p>
          </div>
        )}
      </div>
      <ol>
        {present.map((node, i) => {
          const Icon = node.icon;
          const next = present[i + 1];
          let gap: React.ReactNode = null;
          if (next) {
            const sec = Math.max(0, Math.round((next.time!.getTime() - node.time!.getTime()) / 1000));
            const stageKey = TO_STAGE[next.event];
            const q: Quality = stageKey ? stageQuality(stageKey, sec) : 'neutral';
            gap = (
              <div className="ml-[14px] flex items-center gap-2 py-1">
                <div className="w-0.5 h-4 bg-slate-200" />
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ring-1 ${QGAP[q]}`}>
                  {formatDuration(sec)}
                </span>
              </div>
            );
          }
          return (
            <li key={node.event}>
              <div className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-full ${node.bg} ${node.text} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-slate-800 flex-1 min-w-0 truncate">{node.label}</span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap">
                  {format(node.time!, 'd MMM, HH:mm', { locale: ru })}
                </span>
              </div>
              {gap}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function DriverActivityTimeline({ timelines }: { timelines: OrderTimeline[] }) {
  if (timelines.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white text-center py-10 text-slate-400 text-sm">
        Нет заказов в этом периоде
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {timelines.map((t) => (
        <OrderRow key={t.orderId} t={t} />
      ))}
    </div>
  );
}
