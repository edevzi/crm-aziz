'use client';

import React, { useTransition, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

export function SearchAndFilter({ 
  dict, 
  placeholder, 
  filterOptions, 
  filterPlaceholder = "Все", 
  filterParam = "status",
  hideFilter = false,
  defaultFilter = "all",
}: { 
  dict?: any, 
  placeholder?: string,
  filterOptions?: { value: string, label: string }[],
  filterPlaceholder?: string,
  filterParam?: string,
  hideFilter?: boolean,
  defaultFilter?: string,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Sync query with URL param when searchParams changes externally
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page'); // reset pagination on search
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]); // eslint-disable-line

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (e.target.value && e.target.value !== defaultFilter) {
      params.set(filterParam, e.target.value);
    } else {
      params.delete(filterParam);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        {isPending ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        )}
        <input 
          type="text" 
          placeholder={placeholder || "Поиск..."} 
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium transition-all ${
            isPending 
              ? 'border-primary/40 bg-primary/5' 
              : 'border-slate-200/60'
          }`}
        />
        {isPending && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary/70 font-medium animate-pulse">
            Поиск...
          </span>
        )}
      </div>
      {!hideFilter && (
        <div className="w-full sm:w-56 relative">
          <select 
            defaultValue={searchParams.get(filterParam) || defaultFilter}
            onChange={handleStatus}
            disabled={isPending}
            className={`w-full pl-4 pr-10 py-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-bold text-slate-700 appearance-none transition-all cursor-pointer ${isPending ? 'opacity-60' : ''}`}
          >
            <option value={defaultFilter}>{filterPlaceholder}</option>
            {filterOptions ? filterOptions.filter(opt => opt.value !== defaultFilter).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )) : (
              <>
                <option value="new">{dict?.new || 'Новый'}</option>
                <option value="assigned">{dict?.assigned || 'Назначен'}</option>
                <option value="in_progress">{dict?.in_progress || 'В процессе'}</option>
                <option value="container_placed">{dict?.container_placed || 'Контейнер установлен'}</option>
                <option value="picked_up">{dict?.picked_up || 'Забран'}</option>
                <option value="completed">{dict?.completed || 'Завершен'}</option>
              </>
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      )}
    </div>
  );
}
