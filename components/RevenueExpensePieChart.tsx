'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RevenueExpensePieChart({ 
  revenue, 
  expenses, 
  profit, 
  lang, 
  dict 
}: { 
  revenue: number, 
  expenses: number, 
  profit: number,
  lang: string | undefined,
  dict: any
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="border border-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl animate-pulse h-[350px]" />
    );
  }

  const profitVal = Math.max(0, profit);
  const data = [
    { name: 'Расходы', value: expenses, color: '#f43f5e' }, // rose-500
    { name: 'Доход', value: profitVal, color: '#10b981' } // emerald-500
  ];

  const total = expenses + profitVal;
  const expensePct = total > 0 ? Math.round((expenses / total) * 100) : 0;
  const profitPct = total > 0 ? Math.round((profitVal / total) * 100) : 0;

  return (
    <Card className="border border-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl">
      <CardHeader className="bg-white/40 border-b border-white/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight text-slate-800">
            {'Распределение оборота'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-6">
        <div className="h-[230px] w-full flex items-center justify-center relative">
          {revenue > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <span className="text-sm font-bold text-slate-700">{revenue.toLocaleString()} RUB</span>
              <span className="text-xs font-semibold text-slate-400">{'Оборот'}</span>
            </div>
          )}
          {revenue > 0 ? (
            <ResponsiveContainer width="100%" height="100%" className="z-10">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  wrapperStyle={{ zIndex: 50 }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}
                  formatter={(value: number, name: string) => {
                    const isExpense = name === ('Расходы');
                    const pct = isExpense ? expensePct : profitPct;
                    return [`${value.toLocaleString()} RUB (${pct}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-bold flex flex-col items-center z-10 relative">
              <div className="h-16 w-16 mb-2 rounded-full bg-slate-100 flex items-center justify-center">📉</div>
              {dict.no_data || "Нет данных"}
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 text-[12px] px-2">
          {data.map((entry) => {
            const pct = entry.name === ('Расходы') ? expensePct : profitPct;
            return (
              <div key={entry.name} className="flex items-center justify-between min-w-0 bg-white/50 p-2 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-700 font-bold truncate capitalize">{entry.name}</span>
                </div>
                <span className="text-slate-800 font-extrabold ml-2 flex-shrink-0 text-sm">{pct}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
