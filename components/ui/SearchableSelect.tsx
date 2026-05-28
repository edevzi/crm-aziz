'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  sub?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  onAddNew,
  addNewLabel = '+ Добавить новый',
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.sub?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen(p => !p)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all duration-150 bg-white
          ${open ? 'border-primary ring-1 ring-primary/30' : 'border-slate-200 hover:border-slate-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={`truncate font-medium ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected ? (
            <span>
              {selected.label}
              {selected.sub && <span className="ml-1.5 text-xs text-slate-400">({selected.sub})</span>}
            </span>
          ) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onChange(''); }}
              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">Ничего не найдено</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  onClick={() => !o.disabled && handleSelect(o.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                    ${o.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-primary/5'}
                    ${o.value === value ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700'}
                  `}
                >
                  <span className={`flex-1 truncate ${o.disabled ? 'text-slate-400' : ''}`}>{o.label}</span>
                  {o.sub && <span className="text-xs text-slate-400 flex-shrink-0">{o.sub}</span>}
                </button>
              ))
            )}
          </div>

          {/* Add new */}
          {onAddNew && (
            <div className="border-t border-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => { onAddNew(); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4" />
                {addNewLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
