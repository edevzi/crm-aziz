import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getSafeData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { SafeTransactionForm } from '@/components/forms/SafeTransactionForm';
import { getCurrentUser } from '@/lib/auth';
import { SafeTransactionsTable } from '@/components/tables/SafeTransactionsTable';
import { CloseShiftForm } from '@/components/forms/CloseShiftForm';

export default async function SafePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const user = await getCurrentUser();
  const isOperator = user?.role === 'operator';

  const safeData = await getSafeData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const typeFilter = typeof searchParams.type === 'string' ? searchParams.type : '';

  let filteredTransactions = safeData;

  if (typeFilter && typeFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.transaction.type === typeFilter);
  }
  if (q) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.transaction.note?.toLowerCase().includes(q)
    );
  }

  const totalIncome = safeData.filter(t => t.transaction.type === 'income').reduce((acc, curr) => acc + curr.transaction.amountRub, 0);
  const totalExpense = safeData.filter(t => t.transaction.type === 'expense').reduce((acc, curr) => acc + curr.transaction.amountRub, 0);
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.safe || 'Сейф'}</h1>
          <p className="text-muted-foreground mt-2">{dict.safe_overview || 'Учет наличных средств в сейфе.'}</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto justify-end">
          <CloseShiftForm dict={dict} />
          <SafeTransactionForm dict={dict} type="expense" />
          <SafeTransactionForm dict={dict} type="income" />
        </div>
      </div>
      
      <SearchAndFilter 
        dict={dict} 
        filterOptions={[
          { value: 'income', label: dict.safe_income || 'Приход' },
          { value: 'expense', label: dict.safe_expense || 'Расход' },
        ]} 
        filterParam="type" 
        filterPlaceholder={"Все типы"} 
        placeholder={"Поиск по заметке..."} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{dict.safe_balance || 'Баланс сейфа'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBalance.toLocaleString()} RUB</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.safe_transactions || 'Транзакции сейфа'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SafeTransactionsTable transactions={filteredTransactions} dict={dict} />
        </CardContent>
      </Card>
    </div>
  );
}
