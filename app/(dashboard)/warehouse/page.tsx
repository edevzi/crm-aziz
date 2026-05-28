import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { getWarehouseData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getDictionary } from '@/lib/dictionaries';
import { WarehouseTransactionForm } from '@/components/forms/WarehouseTransactionForm';
import { WarehouseTransactionTable } from '@/components/tables/WarehouseTransactionTable';
import { Box, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export default async function WarehousePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const user = await getCurrentUser();
  const isOperator = user?.role === 'operator';

  const { allTransactions } = await getWarehouseData();
  const allDrivers = await db.select().from(drivers).orderBy(desc(drivers.id));

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const typeFilter = typeof searchParams.type === 'string' ? searchParams.type : '';
  const from = typeof searchParams.from === 'string' ? searchParams.from : '';
  const to = typeof searchParams.to === 'string' ? searchParams.to : '';

  let filteredTransactions = allTransactions;
  if (isOperator) {
    filteredTransactions = filteredTransactions.filter((i: any) => i.operatorId === user?.id);
  }

  if (from) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    filteredTransactions = filteredTransactions.filter((i: any) => new Date(i.recordedAt) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filteredTransactions = filteredTransactions.filter((i: any) => new Date(i.recordedAt) <= toDate);
  }

  if (typeFilter && typeFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter((i: any) => i.type === typeFilter);
  }
  if (q) {
    filteredTransactions = filteredTransactions.filter((i: any) => 
      i.note?.toLowerCase().includes(q)
    );
  }

  let totalInbound = 0;
  let totalOutbound = 0;
  
  filteredTransactions.forEach((tx: any) => {
    if (tx.type === 'inbound') {
      totalInbound += tx.volumeM3;
    } else if (tx.type === 'outbound') {
      totalOutbound += tx.volumeM3;
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.warehouse || 'Склад'}</h1>
            <p className="text-slate-500 mt-1 font-medium">Управление объемом отходов</p>
          </div>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto justify-end">
          <DashboardDatePicker />
          <WarehouseTransactionForm dict={dict} drivers={allDrivers} />
        </div>
      </div>
      
      <SearchAndFilter 
        dict={dict} 
        filterOptions={[
          { value: 'inbound', label: 'Входящие (Inbound)' },
          { value: 'outbound', label: 'Исходящие (Outbound)' },
        ]} 
        filterParam="type" 
        filterPlaceholder="Все типы" 
        placeholder="Поиск по заметке..." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-950">
            <ArrowDownRight className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Всего Приход</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">
              {totalInbound.toLocaleString()} <span className="text-xl font-semibold opacity-70">m³</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-rose-500/5 ring-1 ring-rose-100 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50/50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-rose-950">
            <ArrowUpRight className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-800 uppercase tracking-wider">Всего Расход</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-rose-600 tracking-tight">
              {totalOutbound.toLocaleString()} <span className="text-xl font-semibold opacity-70">m³</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">История</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <WarehouseTransactionTable transactions={filteredTransactions} dict={dict} />
        </CardContent>
      </Card>
    </div>
  );
}
