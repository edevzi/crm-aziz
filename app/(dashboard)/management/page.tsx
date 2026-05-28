import React from 'react';
import { getOperators, getDashboardData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { Sliders } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BulkReassignForm, SingleOrderReassignForm } from '@/components/forms/ManagementForms';

export const dynamic = 'force-dynamic';

export default async function ManagementPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const operators = await getOperators();
  // Fetch all users from db directly here to populate the dropdown.
  const { db } = await import('@/lib/db');
  const { users } = await import('@/lib/schema');
  const allUsers = await db.select().from(users);

  // Fetch recent active orders for the dropdown (or they can just type ID)
  // Typing ID is safer for single order reassignment, but a list is nice.
  const allOrders = await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Sliders className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.management_panel}</h1>
            <p className="text-slate-500 mt-1 font-medium">{'Перенос и переназначение данных'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100">
            <CardTitle>{'Массовое переназначение'}</CardTitle>
            <CardDescription>{'Перенос всех заказов, финансов и доходов склада одного оператора на другого.'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <BulkReassignForm users={allUsers} dict={dict} />
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100">
            <CardTitle>{'Переназначить один заказ'}</CardTitle>
            <CardDescription>{'Переназначить отдельный заказ конкретному сотруднику (оператору).'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SingleOrderReassignForm users={allUsers} allOrders={allOrders} dict={dict} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
