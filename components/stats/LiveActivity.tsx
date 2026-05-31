import React from 'react';
import Link from 'next/link';
import { Activity, ChevronRight, MapPin } from 'lucide-react';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import type { OrderTimeline } from '@/lib/driver-stats-compute';
import { formatDuration } from '@/lib/driver-stats-compute';

const STATUS_LABEL: Record<string, { label: string; cls: string; explain: string }> = {
  assigned: { label: 'Принял заказ', cls: 'bg-violet-50 text-violet-700 ring-violet-100', explain: 'ждёт выезда' },
  in_progress: { label: 'В пути', cls: 'bg-sky-50 text-sky-700 ring-sky-100', explain: 'едет ставить контейнер' },
  container_placed: { label: 'Контейнер поставлен', cls: 'bg-teal-50 text-teal-700 ring-teal-100', explain: 'ждёт окончания аренды' },
  picked_up: { label: 'Контейнер забран', cls: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100', explain: 'едет на свалку' },
};

function timeInCurrentStatus(t: OrderTimeline): number | null {
  const map: Record<string, Date | null> = {
    assigned: t.assignedAt,
    in_progress: t.inProgressAt,
    container_placed: t.containerPlacedAt,
    picked_up: t.pickedUpAt,
  };
  const at = map[t.status];
  if (!at) return null;
  return Math.max(0, Math.round((Date.now() - at.getTime()) / 1000));
}

/**
 * "What's happening right now" — every order whose driver is mid-flight, with
 * an explicit explanation per status. Lets an operator instantly answer
 * "кто чем занят сейчас?". No animations beyond a single dot indicator.
 */
export async function LiveActivity({ activeOrders }: { activeOrders: OrderTimeline[] }) {
  const driverIds = Array.from(new Set(activeOrders.map((o) => o.driverId).filter((x): x is number => x != null)));
  const driverRows = driverIds.length
    ? await db.select({ id: drivers.id, name: drivers.name, plate: drivers.vehiclePlate }).from(drivers).where(inArray(drivers.id, driverIds))
    : [];
  const driverMap = new Map(driverRows.map((d) => [d.id, d]));

  if (activeOrders.length === 0) {
    return (
      <div className="ds-fade rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Сейчас в работе</p>
        </div>
        <p className="text-sm text-slate-400">Нет активных заказов прямо сейчас.</p>
      </div>
    );
  }

  return (
    <div className="ds-fade rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="ds-live-dot inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Сейчас в работе</p>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md ring-1 ring-emerald-100">
            {activeOrders.length}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {activeOrders.slice(0, 6).map((o) => {
          const drv = o.driverId != null ? driverMap.get(o.driverId) : null;
          const st = STATUS_LABEL[o.status] || { label: o.status, cls: 'bg-slate-100 text-slate-700 ring-slate-200', explain: '' };
          const inStatus = timeInCurrentStatus(o);
          return (
            <li key={o.orderId}>
              <Link
                href={drv ? `/driver-stats/${drv.id}` : '#'}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800">#{o.orderId}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ring-1 ${st.cls}`}>{st.label}</span>
                    {inStatus != null && (
                      <span className="text-[11px] font-bold text-slate-500">· {formatDuration(inStatus)} в этом статусе</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 min-w-0">
                    <span className="font-bold text-slate-700 truncate">{drv?.name || 'Без водителя'}</span>
                    {drv?.plate && <span className="font-mono text-slate-400 hidden sm:inline">{drv.plate}</span>}
                    {o.address && <span className="hidden sm:inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {o.address}</span>}
                  </div>
                  {st.explain && <p className="text-[11px] text-slate-400 mt-0.5">{st.explain}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
      {activeOrders.length > 6 && (
        <div className="px-5 py-2 text-xs text-slate-400 border-t border-slate-100">
          и ещё {activeOrders.length - 6}…
        </div>
      )}
    </div>
  );
}
