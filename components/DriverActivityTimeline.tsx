import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Package, FilePlus2, Eye, CheckCircle2, Truck, PackagePlus, Recycle, Flag, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDuration, type OrderTimeline } from '@/lib/driver-stats-compute';
import { stageQuality, type StageKey, type Quality } from '@/lib/driver-stats-meta';

const NODES: { event: string; label: string; key: keyof OrderTimeline; icon: any; grad: string; actor: string }[] = [
  { event: 'created', label: 'Заказ создан', key: 'createdAt', icon: FilePlus2, grad: 'from-slate-400 to-slate-500', actor: 'оператор' },
  { event: 'viewed', label: 'Открыл в приложении', key: 'viewedAt', icon: Eye, grad: 'from-sky-400 to-cyan-500', actor: 'водитель' },
  { event: 'assigned', label: 'Принял заказ', key: 'assignedAt', icon: CheckCircle2, grad: 'from-violet-500 to-indigo-500', actor: 'водитель' },
  { event: 'in_progress', label: 'Выехал к клиенту', key: 'inProgressAt', icon: Truck, grad: 'from-sky-500 to-blue-500', actor: 'водитель' },
  { event: 'container_placed', label: 'Поставил контейнер', key: 'containerPlacedAt', icon: PackagePlus, grad: 'from-teal-500 to-emerald-500', actor: 'водитель' },
  { event: 'picked_up', label: 'Забрал контейнер', key: 'pickedUpAt', icon: Recycle, grad: 'from-fuchsia-500 to-purple-500', actor: 'водитель' },
  { event: 'completed', label: 'Завершил заказ', key: 'completedAt', icon: Flag, grad: 'from-emerald-500 to-green-600', actor: 'водитель' },
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
  neutral: 'bg-slate-50 text-slate-600 ring-slate-100',
};

function statusBadge(status: string) {
  switch (status) {
    case 'new': return <Badge variant="info">Новый</Badge>;
    case 'assigned': return <Badge variant="secondary">Принят</Badge>;
    case 'in_progress': return <Badge variant="warning">В пути</Badge>;
    case 'container_placed': return <Badge variant="warning">Поставлен</Badge>;
    case 'picked_up': return <Badge variant="info">Забран</Badge>;
    case 'completed': return <Badge variant="success">Завершён</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

function OrderRow({ t }: { t: OrderTimeline }) {
  const present = NODES.map((n) => ({ ...n, time: t[n.key] as Date | null })).filter((n) => n.time);

  return (
    <div className="ds-fade rounded-2xl border border-slate-200/60 bg-white shadow-sm p-4 sm:p-5">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-800">Заказ #{t.orderId}</span>
            {statusBadge(t.status)}
          </div>
          {(t.clientName || t.address) && (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              {t.address && <MapPin className="h-3.5 w-3.5 text-slate-400" />}
              <span className="truncate">{t.clientName || ''}{t.clientName && t.address ? ' · ' : ''}{t.address || ''}</span>
            </p>
          )}
        </div>
        {t.scheduledAt && (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Плановое время</p>
            <p className="text-sm font-bold text-slate-700">{format(t.scheduledAt, 'd MMM, HH:mm', { locale: ru })}</p>
          </div>
        )}
      </div>

      {/* timeline */}
      <ol className="space-y-0">
        {present.map((node, i) => {
          const Icon = node.icon;
          const next = present[i + 1];
          let gapNode: React.ReactNode = null;
          if (next) {
            const seconds = Math.max(0, Math.round((next.time!.getTime() - node.time!.getTime()) / 1000));
            const stageKey = TO_STAGE[next.event];
            const q: Quality = stageKey ? stageQuality(stageKey, seconds) : 'neutral';
            gapNode = (
              <div className="ml-3.5 flex items-center gap-2 py-1.5">
                <div className="w-0.5 h-5 bg-slate-200" />
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ring-1 ${QGAP[q]}`}>
                  {formatDuration(seconds)}
                </span>
              </div>
            );
          }
          return (
            <li key={node.event}>
              <div className="flex items-start gap-3">
                <div
                  className={`h-7 w-7 rounded-full bg-gradient-to-br ${node.grad} flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5`}
                >
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{node.label}</p>
                    <p className="text-[11px] text-slate-400">{node.actor}</p>
                  </div>
                  <p className="text-xs text-slate-600 font-bold tabular-nums whitespace-nowrap">
                    {format(node.time!, 'd MMM, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>
              {gapNode}
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
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-slate-200/60 bg-white">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Package className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-slate-700 font-bold">Нет активности за период</p>
        <p className="text-slate-400 text-sm mt-1">Здесь появятся этапы выполнения заказов этого водителя.</p>
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
