'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSortableTable } from '@/hooks/use-sortable-table';

interface SafeTransactionData {
  transaction: {
    id: number;
    recordedAt: string | Date;
    type: string;
    note: string | null;
    amountRub: number;
  };
  operator: {
    name: string | null;
  } | null;
}

interface SafeTransactionsTableProps {
  transactions: SafeTransactionData[];
  dict: any;
}

export function SafeTransactionsTable({ transactions, dict }: SafeTransactionsTableProps) {
  const { sortedData: sortedTransactions, sortKey, sortDirection, toggleSort } = useSortableTable(transactions);

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <SortableTableHead 
            sortKey="transaction.recordedAt" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.date}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="transaction.type" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.transaction_type || 'Тип'}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="transaction.note" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.note}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="operator.name" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            Оператор
          </SortableTableHead>
          <SortableTableHead 
            sortKey="transaction.amountRub" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
            className="text-right"
          >
            {dict.amount} (RUB)
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTransactions.map((t) => (
          <TableRow key={t.transaction.id}>
            <TableCell>{format(new Date(t.transaction.recordedAt), 'dd.MM.yyyy')}</TableCell>
            <TableCell>
              <Badge variant={t.transaction.type === 'income' ? 'outline' : 'secondary'} className={t.transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}>
                {t.transaction.type === 'income' ? (dict.safe_income || 'Приход') : (dict.safe_expense || 'Расход')}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{t.transaction.note || '-'}</TableCell>
            <TableCell>{t.operator?.name || 'Система'}</TableCell>
            <TableCell className={`text-right font-medium ${t.transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.transaction.type === 'income' ? '+' : '-'}{t.transaction.amountRub.toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {sortedTransactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              {dict.no_safe_transactions || 'Транзакций в сейфе не найдено.'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
