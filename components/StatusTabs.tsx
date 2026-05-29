'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Loader2 } from 'lucide-react';

export function StatusTabs({ 
  options, 
  filterParam = "status",
  defaultFilter = "all",
}: { 
  options: { value: string, label: string }[],
  filterParam?: string,
  defaultFilter?: string,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentVal = searchParams.get(filterParam) || defaultFilter;

  const handleStatus = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // reset pagination on filter change
    if (val && val !== defaultFilter) {
      params.set(filterParam, val);
    } else {
      params.delete(filterParam);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="w-full sm:w-[320px] relative">
        <Select 
          value={currentVal} 
          onValueChange={handleStatus}
          disabled={isPending}
        >
          <SelectTrigger className={`w-full bg-white h-12 rounded-xl border-slate-200/60 shadow-sm font-semibold text-slate-700 hover:border-primary/50 transition-all ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <div className="flex items-center gap-2.5">
              {isPending ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Filter className="w-4 h-4 text-primary" />
              )}
              <SelectValue placeholder="Фильтр" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200/60 shadow-lg font-medium p-1">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="rounded-lg cursor-pointer py-2.5 pl-8 pr-4 focus:bg-primary/5 focus:text-primary">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && (
          <div className="absolute inset-0 rounded-xl bg-white/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          </div>
        )}
      </div>
    </div>
  );
}
