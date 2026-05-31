import React from 'react';
import { format } from 'date-fns';
import { ArrowRight, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDuration, type OrderTimeline } from '@/lib/driver-stats';

const STEPS: { key: keyof OrderTimeline; label: string; dot: string }[] = [
  { key: 'createdAt', label: 'Создан', dot: 'bg-slate-300' },
  { key: 'viewedAt', label: 'Просмотрел', dot: 'bg-sky-400' },
  { key: 'assignedAt', label: 'Принял', dot: 'bg-amber-400' },
  { key: 'inProgressAt', label: 'Выехал', dot: 'bg-orange-500' },
  { key: 'containerPlacedAt', label: 'Поставил', dot: 'bg-teal-500' },
  { key: 'pickedUpAt', label: 'Забрал', dot: 'bg-emerald-500' },
  { key: 'completedAt', label: 'Завершил', dot: 'bg-violet-600' },
];

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
  // Keep only the steps that actually happened, with the gap from the previous one.
  const present: { label: string; dot: string; time: Date; deltaFromPrev: number | null }[] = [];
  let prev: Date | null = null;
  for (const s of STEPS) {
    const time = t[s.key] as Date | null;
    if (!time) continue;
    const deltaFromPrev = prev ? Math.max(0, Math.round((time.getTime() - prev.getTime()) / 1000)) : null;
    present.push({ label: s.label, dot: s.dot, time, deltaFromPrev });
    prev = time;
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-4 sm:p-5">
      {/* Order header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-extrabold text-slate-800">#{t.orderId}</span>
          {statusBadge(t.status)}
          <span className="text-sm text-slate-500 truncate">{t.clientName || t.address || '—'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          {t.scheduledAt && <span>План: {format(t.scheduledAt, 'dd.MM.yyyy HH:mm')}</span>}
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
            Итого: {formatDuration(t.durations.total)}
          </span>
        </div>
      </div>

      {/* Timeline of steps that actually happened */}
      <div className="flex flex-wrap items-center gap-y-3">
        {present.map((p, i) => (
          <React.Fragment key={p.label}>
            {i > 0 && (
              <div className="flex items-center gap-1 px-1.5 text-slate-400">
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  {formatDuration(p.deltaFromPrev)}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${p.dot} flex-shrink-0`} />
              <div className="leading-tight">
                <div className="text-[11px] font-bold text-slate-600">{p.label}</div>
                <div className="text-[11px] text-slate-400 font-mono">{format(p.time, 'dd.MM HH:mm')}</div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
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
    <div className="space-y-3">
      {timelines.map((t) => (
        <OrderRow key={t.orderId} t={t} />
      ))}
    </div>
  );
}
