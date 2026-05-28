import React from 'react';

export default function OrdersLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-200 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-8 w-40 bg-slate-200 rounded-lg" />
            <div className="h-4 w-56 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-2xl" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-9 w-24 bg-slate-200 rounded-full" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-3xl border border-slate-200/60 overflow-hidden bg-white/80">
        {/* Table header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex gap-4">
          {[40, 120, 160, 100, 100, 80, 80, 80].map((w, i) => (
            <div key={i} className={`h-4 bg-slate-200 rounded`} style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="border-b border-slate-100 px-6 py-4 flex gap-4 items-center">
            <div className="h-5 w-10 bg-slate-100 rounded" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-20 bg-slate-50 rounded" />
            </div>
            <div className="h-4 w-40 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
