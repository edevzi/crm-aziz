import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * One KPI card that always carries its own self-explanation.
 * — `title`: what the number is ("Время реакции")
 * — `value`: the number itself
 * — `explanation`: a single plain-language sentence answering "what does this mean?"
 *
 * The explanation is shown inline (not behind a tooltip) so a non-technical user
 * never has to guess. Matches mobile-first single-column layout.
 */
export function MetricCard({
  title,
  value,
  unit,
  icon,
  iconBg = 'bg-slate-50',
  iconColor = 'text-slate-500',
  explanation,
  valueColor,
  footer,
}: {
  title: string;
  value: React.ReactNode;
  unit?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  explanation: string;
  valueColor?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="ds-fade border border-slate-200/60 shadow-sm rounded-2xl bg-white h-full">
      <CardContent className="p-4 sm:p-5 flex flex-col h-full">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
            {icon}
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
        </div>
        <p className={`text-3xl font-extrabold tracking-tight mt-3 ${valueColor || 'text-slate-900'}`}>
          {value}
          {unit && <span className="text-base font-bold text-slate-400 ml-1">{unit}</span>}
        </p>
        <p className="text-xs text-slate-500 leading-snug mt-2">{explanation}</p>
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}
