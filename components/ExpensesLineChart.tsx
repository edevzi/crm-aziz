'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CATEGORY_COLORS: Record<string, string> = {
  fuel: '#f59e0b',
  diesel: '#f59e0b',
  gai: '#ef4444',
  driver_salary: '#3b82f6',
  dispatcher_salary: '#6366f1',
  utilization: '#8b5cf6',
  spare_parts: '#64748b',
  tractor: '#f97316',
  master_fee: '#d97706',
};

const DEFAULT_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e', '#06b6d4'];

export function ExpensesLineChart({
  data,
  categories,
  dict,
  lang
}: {
  data: any[],
  categories: string[],
  dict: any,
  lang?: string
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white/50 animate-pulse h-[400px]" />
    );
  }

  const getCategoryLabel = (cat: string) => {
    return dict[cat] || cat.replace('_', ' ');
  };

  return (
    <Card className="lg:col-span-2 border border-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl">
      <CardHeader className="bg-white/40 border-b border-white/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-indigo-500" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight text-slate-800">
            {'Динамика расходов'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {categories.map((cat, i) => {
                  const color = CATEGORY_COLORS[cat] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <linearGradient key={`color-${cat}`} id={`color-${cat}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val >= 1000 ? (val / 1000) + 'k' : val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}
                itemStyle={{ fontWeight: '600', fontSize: '13px' }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} RUB`,
                  getCategoryLabel(name)
                ]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: '600' }}
                formatter={(value) => getCategoryLabel(value)}
              />
              {categories.map((cat, i) => {
                const color = CATEGORY_COLORS[cat] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                return (
                  <Area
                    key={cat}
                    type="monotone"
                    name={cat}
                    dataKey={cat}
                    stackId="a"
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#color-${cat})`}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}