'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e', '#06b6d4'];

export function ExpensesBreakdownPieChart({ 
  expensesByCategory, 
  dict 
}: { 
  expensesByCategory: { name: string, value: number }[],
  dict: any 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white/50 animate-pulse h-[350px]" />
    );
  }

  const translatedExpenses = expensesByCategory.map(e => ({
    name: dict[e.name as keyof typeof dict] || e.name.replace('_', ' '),
    value: e.value
  }));

  return (
    <Card className="border border-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl">
      <CardHeader className="bg-white/40 border-b border-white/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight text-slate-800">
            {dict.expenses_breakdown || "Распределение расходов"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-6">
        <div className="h-[230px] w-full flex items-center justify-center relative">
          {translatedExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={translatedExpenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {translatedExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-bold flex flex-col items-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-slate-100 flex items-center justify-center">📉</div>
              {dict.no_expenses || "No expenses"}
            </div>
          )}
          {translatedExpenses.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl">💸</span>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] max-h-[85px] overflow-y-auto pr-1">
          {translatedExpenses.map((entry, index) => {
            const total = translatedExpenses.reduce((sum, e) => sum + e.value, 0);
            const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={entry.name} className="flex items-center justify-between min-w-0 bg-white/50 p-1.5 rounded-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-700 font-bold truncate capitalize" title={entry.name}>{entry.name}</span>
                </div>
                <span className="text-slate-500 font-extrabold ml-1 flex-shrink-0">{percent}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
