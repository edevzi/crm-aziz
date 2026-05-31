"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, startOfMonth, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowRight, Loader2 } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Button } from "./ui/button";
import { useEffect as useLayoutEffect } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function DashboardDatePicker() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let fromDate;
    let toDate;

    if (from) fromDate = new Date(from);
    else {
      const today = new Date();
      fromDate = startOfMonth(today);
    }

    if (to) toDate = new Date(to);
    else {
      toDate = new Date();
    }
    
    setDate({ from: fromDate, to: toDate });
  }, [searchParams]);

  const handleApply = (range?: DateRange) => {
    const selectedRange = range || date;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // reset pagination
    
    if (selectedRange?.from) {
      params.set("from", format(selectedRange.from, "yyyy-MM-dd"));
    }
    if (selectedRange?.to) {
      params.set("to", format(selectedRange.to, "yyyy-MM-dd"));
    }
    
    setOpen(false);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.delete('page');
    setOpen(false);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const setPreset = (type: 'today' | 'week' | 'month') => {
    const today = new Date();
    let fromDate = today;

    if (type === 'week') {
      fromDate = subDays(today, 6);
    } else if (type === 'month') {
      fromDate = startOfMonth(today);
    }

    const newRange = { from: fromDate, to: today };
    setDate(newRange);
    handleApply(newRange);
  };

  const hasFilter = searchParams.has("from") || searchParams.has("to");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Preset Buttons */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50 w-full sm:w-auto">
        <button onClick={() => setPreset('today')} disabled={isPending} className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1">
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}Сегодня
        </button>
        <button onClick={() => setPreset('week')} disabled={isPending} className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Неделя</button>
        <button onClick={() => setPreset('month')} disabled={isPending} className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Месяц</button>
      </div>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button className={`flex justify-center items-center w-full sm:w-auto sm:min-w-[240px] gap-2 bg-white px-3 sm:px-4 py-2 rounded-xl shadow-sm border ${hasFilter ? 'border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-700'} hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
            <CalendarIcon className={`w-4 h-4 flex-shrink-0 ${hasFilter ? 'text-indigo-500' : 'text-slate-400'}`} />
            <span className="truncate">
            {date?.from ? (
              date.to ? (
                <>
                  {isMobile ? format(date.from, "dd.MM") : format(date.from, "dd.MM.yyyy")}
                  <ArrowRight className={`w-3 h-3 inline mx-0.5 ${hasFilter ? 'text-indigo-300' : 'text-slate-300'}`} />
                  {isMobile ? format(date.to, "dd.MM") : format(date.to, "dd.MM.yyyy")}
                </>
              ) : (
                format(date.from, "dd.MM.yyyy")
              )
            ) : (
              'Выберите период'
            )}
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 sm:p-4 mt-2 max-w-[calc(100vw-1rem)] overflow-auto"
            align="end"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <style>{`
              .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: #4f46e5;
                --rdp-background-color: #e0e7ff;
                --rdp-outline: 2px solid var(--rdp-accent-color);
                --rdp-outline-offset: 2px;
                margin: 0;
              }
              .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                background-color: var(--rdp-accent-color);
                color: white;
              }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                background-color: #f1f5f9;
              }
            `}</style>
            <DayPicker
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={isMobile ? 1 : 2}
              locale={ru}
              showOutsideDays={true}
              fixedWeeks={true}
              className="p-0 font-sans"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                Сбросить
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={() => handleApply()} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Применить
                </Button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
