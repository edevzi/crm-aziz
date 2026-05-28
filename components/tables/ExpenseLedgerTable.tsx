'use client';

import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { ExpenseForm } from '@/components/forms/ExpenseForm';

interface MappedExpense {
  id: number;
  recordedAt: string | Date;
  category: string;
  note: string | null;
  amountRub: number;
  orderId: number | null;
  resolvedCategoryLabel: string;
  // include other necessary fields for ExpenseForm if needed, or just cast it
}

interface ExpenseLedgerTableProps {
  expenses: MappedExpense[];
  dict: any;
  allDrivers: any[];
  allDispatchers: any[];
  lang?: string;
}

export function ExpenseLedgerTable({ expenses, dict, allDrivers, allDispatchers, lang }: ExpenseLedgerTableProps) {
  const { sortedData: sortedExpenses, sortKey, sortDirection, toggleSort } = useSortableTable(expenses);

  return (
    <Table>
      <TableHeader className="bg-slate-50/80">
        <TableRow>
          <SortableTableHead 
            sortKey="recordedAt" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.date}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="resolvedCategoryLabel" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.category}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="note" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.note}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="amountRub" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
            className="text-right"
          >
            {dict.amount}
          </SortableTableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedExpenses.slice(0, 50).map((expense) => (
          <TableRow key={expense.id}>
            <TableCell className="text-xs text-slate-500">{format(new Date(expense.recordedAt), 'dd.MM.yyyy')}</TableCell>
            <TableCell>
              <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md inline-flex">
                {expense.resolvedCategoryLabel}
              </span>
            </TableCell>
            <TableCell className="text-xs font-medium text-slate-600">
              {expense.orderId ? (
                <Link href={`/orders/${expense.orderId}`} className="text-blue-600 hover:underline">
                  {expense.note || `Заказ #${expense.orderId}`}
                </Link>
              ) : (
                expense.note || '-'
              )}
            </TableCell>
            <TableCell className="text-right text-sm text-rose-600 font-extrabold">-{expense.amountRub.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <ExpenseForm dict={dict} expense={expense as any} drivers={allDrivers} dispatchers={allDispatchers} />
            </TableCell>
          </TableRow>
        ))}
        {sortedExpenses.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
              {"Расходы не найдены."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
