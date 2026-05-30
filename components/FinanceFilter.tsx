'use client';

import React, { useTransition, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Calendar, Filter, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

interface FinanceFilterProps {
  dict: any;
  expenseCategories: { value: string; label: string }[];
  incomeSources: { value: string; label: string }[];
}

export function FinanceFilter({
  dict,
  expenseCategories,
  incomeSources,
}: FinanceFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTab = searchParams.get('tab') || 'expenses';
  const currentCategory = searchParams.get('category') || 'all';
  const currentSource = searchParams.get('source') || 'all';
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Sync inputs with URL changes (e.g. when filters are cleared)
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Debounced search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query !== (searchParams.get('q') || '')) {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set('q', query);
        } else {
          params.delete('q');
        }
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, pathname, router, searchParams]);

  const handleTabChange = (tab: 'expenses' | 'income') => {
    if (tab === currentTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    // Clear category/source when switching tabs to avoid state conflicts
    params.delete('category');
    params.delete('source');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    const paramName = currentTab === 'expenses' ? 'category' : 'source';

    if (val && val !== 'all') {
      params.set(paramName, val);
    } else {
      params.delete(paramName);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    setQuery('');
    const params = new URLSearchParams();
    params.set('tab', currentTab); // Keep current tab
    
    // Preserve date params if any
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam) params.set('from', fromParam);
    if (toParam) params.set('to', toParam);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const hasActiveFilters = 
    query || 
    (currentTab === 'expenses' && currentCategory !== 'all') || 
    (currentTab === 'income' && currentSource !== 'all');

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm ring-1 ring-slate-100 space-y-6">
      {/* Tab Selectors */}
      <div className="flex p-1 bg-slate-100/80 rounded-2xl w-full max-w-md">
        <button
          onClick={() => handleTabChange('expenses')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            currentTab === 'expenses'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown className={`h-4 w-4 ${currentTab === 'expenses' ? 'text-rose-500' : 'text-slate-400'}`} />
          {dict.expenses || 'Расходы'}
        </button>
        <button
          onClick={() => handleTabChange('income')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            currentTab === 'income'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className={`h-4 w-4 ${currentTab === 'income' ? 'text-emerald-500' : 'text-slate-400'}`} />
          {dict.income || 'Доходы'}
        </button>
      </div>

      {/* Grid Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Search Query */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{dict.note || "Заметка"}</label>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 ${isPending ? 'animate-pulse text-primary' : ''}`} />
            <input
              type="text"
              placeholder={
                currentTab === 'expenses'
                  ? dict.search_expense_placeholder || "Заметка..."
                  : dict.search_income_placeholder || "Клиент..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {/* Dropdown for Category / Source */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            {currentTab === 'expenses' ? dict.category || "Категория" : dict.income_source || "Источник дохода"}
          </label>
          <div className="relative">
            <select
              value={currentTab === 'expenses' ? currentCategory : currentSource}
              onChange={handleDropdownChange}
              className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-bold text-slate-700 appearance-none transition-all cursor-pointer"
            >
              <option value="all">
                {currentTab === 'expenses'
                  ? dict.filterPlaceholder || "Все категории"
                  : dict.filter_all_sources || "Все источники"}
              </option>
              {(currentTab === 'expenses' ? expenseCategories : incomeSources).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <Filter className="h-4 w-4" />
            </div>
          </div>
        </div>


      </div>

      {/* Active Filters Clear Button */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all border border-slate-200/50 hover:border-rose-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {dict.clear_filters || "Сбросить фильтры"}
          </button>
        </div>
      )}
    </div>
  );
}
