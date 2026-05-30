import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface MetricCardProps {
  title: string;
  value: string | number;
  prevValue?: string | number;
  unit?: string;
  trend: number;
  icon?: React.ReactNode;
  colorScheme: "indigo" | "emerald" | "rose" | "blue" | "amber" | "purple" | "cyan" | "orange" | "slate";
  href?: string;
  isActive?: boolean;
  percentageOfTotal?: number;
  percentageLabel?: string;
  subText?: React.ReactNode;
}

export function MetricCard({ title, value, prevValue, unit, trend, icon, colorScheme, href, isActive, percentageOfTotal, percentageLabel, subText }: MetricCardProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isNeutral = trend === 0;

  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-500",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-500",
    rose: "bg-rose-50 text-rose-600 ring-rose-500",
    blue: "bg-blue-50 text-blue-600 ring-blue-500",
    amber: "bg-amber-50 text-amber-600 ring-amber-500",
    purple: "bg-purple-50 text-purple-600 ring-purple-500",
    cyan: "bg-cyan-50 text-cyan-600 ring-cyan-500",
    orange: "bg-orange-50 text-orange-600 ring-orange-500",
    slate: "bg-slate-50 text-slate-600 ring-slate-500",
  };

  const colorClass = colorClasses[colorScheme] || colorClasses.slate;
  const iconBg = colorClass.split(' ').slice(0, 2).join(' '); // get bg and text
  const activeRing = colorClass.split(' ')[2]; // get ring color

  const cardContent = (
    <Card className={`h-full border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white transition-all duration-200 ${href ? 'hover:shadow-md hover:border-slate-300 cursor-pointer active:scale-[0.99]' : 'hover:shadow-md'} ${isActive ? `ring-2 ${activeRing} shadow-md` : ''}`}>
      <CardHeader className="pb-2 pt-4 sm:pt-5 px-4 sm:px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider leading-tight">{title}</CardTitle>
        {icon && (
          <div className={`p-2 rounded-xl ${iconBg}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex flex-col gap-1">
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-end gap-1.5 sm:gap-2 flex-wrap">
            <span>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {unit && <span className="text-base font-semibold text-slate-400 ml-1">{unit}</span>}
            </span>
            {subText && (
              <span className="text-sm font-bold text-slate-500 mb-1 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">{subText}</span>
            )}
          </div>
          
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : isNegative ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-slate-400 text-xs font-medium truncate">
              {prevValue !== undefined ? (
                <>Было: <span className="font-semibold text-slate-500">{typeof prevValue === 'number' ? prevValue.toLocaleString() : prevValue} {unit}</span></>
              ) : (
                "к прошлому периоду"
              )}
            </span>
            {percentageOfTotal !== undefined && (
              <span className="ml-auto text-xs font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                {percentageOfTotal}% {percentageLabel || 'от общ.'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
