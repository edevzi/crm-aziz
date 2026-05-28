import React from 'react';

export default function FinanceLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-2xl" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="h-28 bg-white border border-slate-200/60 rounded-2xl p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-36 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/60 overflow-hidden bg-white/80">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex gap-4">
          {[80, 120, 200, 80, 100].map((w, i) => (
            <div key={i} className="h-4 bg-slate-200 rounded" style={{ width: w }} />
          ))}
        </div>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="border-b border-slate-100 px-6 py-4 flex gap-4 items-center">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-48 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
