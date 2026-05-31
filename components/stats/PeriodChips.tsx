'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type Preset = 'today' | 'week' | 'month';

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeFor(p: Preset): { from: string; to: string } {
  const today = startOfDay(new Date());
  const day = 24 * 60 * 60 * 1000;
  const back = p === 'today' ? 0 : p === 'week' ? 6 : 29;
  const from = new Date(today.getTime() - back * day);
  return { from: fmt(from), to: fmt(today) };
}

/** Detect which preset (if any) the current URL params match. */
function detectActive(fromStr: string | null, toStr: string | null): Preset | null {
  if (!fromStr || !toStr) return null;
  const today = startOfDay(new Date());
  const f = startOfDay(new Date(fromStr));
  const t = startOfDay(new Date(toStr));
  if (t.getTime() !== today.getTime()) return null;
  const day = 24 * 60 * 60 * 1000;
  const back = Math.round((today.getTime() - f.getTime()) / day);
  if (back === 0) return 'today';
  if (back === 6) return 'week';
  if (back === 29) return 'month';
  return null;
}

const LABEL: Record<Preset, string> = {
  today: 'Сегодня',
  week: '7 дней',
  month: '30 дней',
};

/**
 * Three-pill segmented control. No custom range, no popover — just the three
 * intervals operators actually use. URL is the source of truth; default is "7 дней".
 */
export function PeriodChips() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const from = search.get('from');
  const to = search.get('to');
  // No params → treat as the default (7 дней) so the right pill is lit on first load too.
  const active: Preset = detectActive(from, to) ?? (from || to ? ('today' as Preset) : 'week');

  const goto = (p: Preset) => {
    const r = rangeFor(p);
    const params = new URLSearchParams(search.toString());
    params.set('from', r.from);
    params.set('to', r.to);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div role="tablist" className="inline-flex w-full sm:w-auto rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
      {(['today', 'week', 'month'] as Preset[]).map((p) => {
        const isActive = active === p;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={isActive}
            onClick={() => goto(p)}
            disabled={isPending}
            className={[
              'flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors duration-150',
              isActive
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700',
              isPending ? 'opacity-60' : '',
            ].join(' ')}
          >
            {LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}
