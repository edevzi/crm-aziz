'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e', '#06b6d4'];

export function FinanceCharts({ 
  monthlyData, 
  expensesByCategory, 
  dict 
}: { 
  monthlyData: { month: string, income: number, expenses: number }[],
  expensesByCategory: { name: string, value: number }[],
  dict: any 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[350px]">
        <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-white/50 animate-pulse" />
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-white/50 animate-pulse" />
      </div>
    );
  }

  const translatedExpenses = expensesByCategory.map(e => ({
    name: dict[e.name as keyof typeof dict] || e.name.replace('_', ' '),
    value: e.value
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="bg-white/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">
            {dict.financial_overview || "Financial Overview"} ({dict.last_6_months || "6 Months"})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Legend iconType="circle" />
                <Bar name={dict.total_income || "Income"} dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name={dict.total_expenses || "Expenses"} dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="bg-white/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">
            {dict.expenses_breakdown || "Expenses Breakdown"} ({dict.all_time || "All Time"})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[230px] w-full flex items-center justify-center">
            {translatedExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={translatedExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {translatedExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm font-medium">{dict.no_expenses || "No expenses"}</div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs max-h-[70px] overflow-y-auto px-2">
            {translatedExpenses.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-600 font-medium truncate capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
