'use client';

import React, { useTransition, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, pathname, router]);

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
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
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 ${isPending ? 'animate-pulse text-primary' : ''}`} />
        <input 
          type="text" 
          placeholder={placeholder || "Поиск..."} 
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium transition-all"
        />
      </div>
      {!hideFilter && (
        <div className="w-full sm:w-56 relative">
          <select 
            defaultValue={searchParams.get(filterParam) || defaultFilter}
            onChange={handleStatus}
            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-bold text-slate-700 appearance-none transition-all cursor-pointer"
          >
            <option value={defaultFilter}>{filterPlaceholder}</option>
            {filterOptions ? filterOptions.filter(opt => opt.value !== defaultFilter).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )) : (
              <>
                <option value="new">{dict?.new || 'New'}</option>
                <option value="assigned">{dict?.assigned || 'Assigned'}</option>
                <option value="in_progress">{dict?.in_progress || 'In Progress'}</option>
                <option value="container_placed">{dict?.container_placed || 'Container Placed'}</option>
                <option value="picked_up">{dict?.picked_up || 'Picked Up'}</option>
                <option value="completed">{dict?.completed || 'Completed'}</option>
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
