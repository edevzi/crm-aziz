import React from 'react';
import { Fuel, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { TankSummary } from '@/lib/fuel-tank';

const FILL_STOPS = {
  ok: { from: '#10b981', to: '#059669', track: 'ring-emerald-100', text: 'text-emerald-700', sub: 'Норма' },
  low: { from: '#f59e0b', to: '#d97706', track: 'ring-amber-100', text: 'text-amber-700', sub: 'Заканчивается' },
  empty: { from: '#f43f5e', to: '#e11d48', track: 'ring-rose-100', text: 'text-rose-700', sub: 'Пусто — нужна заправка' },
} as const;

function fmtL(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} L`;
}

/**
 * "Termometre" / tank — vertical fill bar with current litres, capacity, %,
 * and inbound/outbound side stats. Pure presentation.
 */
export function BaseTankCard({ summary, variant = 'full' }: { summary: TankSummary; variant?: 'full' | 'compact' }) {
  const s = FILL_STOPS[summary.level];
  const pct = Math.round(summary.fillFrac * 100);
  const heightPct = `${Math.max(2, summary.fillFrac * 100)}%`;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 rounded-2xl bg-white border border-slate-200/60 ring-1 ${s.track} p-4`}>
        <TankShape heightPct={heightPct} colourFrom={s.from} colourTo={s.to} width={36} height={56} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">База · солярка</p>
          <p className={`text-xl font-extrabold ${s.text} tabular-nums leading-tight`}>{fmtL(summary.currentL)}</p>
          <p className="text-[11px] text-slate-500">
            из {fmtL(summary.capacityL)} · {pct}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-white border border-slate-200/60 ring-1 ${s.track} shadow-sm overflow-hidden`}>
      <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-center">
        <TankShape heightPct={heightPct} colourFrom={s.from} colourTo={s.to} width={72} height={132} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-slate-400" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Бак на базе · солярка</p>
          </div>
          <p className={`text-3xl sm:text-4xl font-extrabold tabular-nums leading-tight mt-2 ${s.text}`}>
            {fmtL(summary.currentL)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            из {fmtL(summary.capacityL)} ({pct}%) · <span className={`font-bold ${s.text}`}>{s.sub}</span>
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <SideStat
              icon={<ArrowUpRight className="h-4 w-4" />}
              tile="bg-emerald-50 text-emerald-700"
              label="Залито всего"
              value={fmtL(summary.totalInboundL)}
            />
            <SideStat
              icon={<ArrowDownRight className="h-4 w-4" />}
              tile="bg-rose-50 text-rose-700"
              label="Выдано всего"
              value={fmtL(summary.totalOutboundL)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SideStat({
  icon,
  tile,
  label,
  value,
}: {
  icon: React.ReactNode;
  tile: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50/60 ring-1 ring-slate-100 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className={`h-5 w-5 rounded-md flex items-center justify-center ${tile}`}>{icon}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-extrabold text-slate-900 tabular-nums mt-1">{value}</p>
    </div>
  );
}

function TankShape({
  heightPct,
  colourFrom,
  colourTo,
  width,
  height,
}: {
  heightPct: string;
  colourFrom: string;
  colourTo: string;
  width: number;
  height: number;
}) {
  // Simple vertical tank — outer rounded rectangle, fill grows from the bottom.
  return (
    <div
      className="relative flex-shrink-0 rounded-[14px] bg-slate-100 ring-1 ring-slate-200 overflow-hidden"
      style={{ width, height }}
      aria-hidden
    >
      <div
        className="absolute left-0 right-0 bottom-0 transition-[height] duration-700 ease-out"
        style={{
          height: heightPct,
          background: `linear-gradient(180deg, ${colourFrom}, ${colourTo})`,
        }}
      />
      {/* subtle "scale" lines */}
      <div className="absolute inset-x-0 top-1/4 h-px bg-white/40" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
      <div className="absolute inset-x-0 top-3/4 h-px bg-white/40" />
    </div>
  );
}
