'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSortableTable } from '@/hooks/use-sortable-table';

interface IncomeItem {
  id: string;
  type: 'order' | 'warehouse';
  rawId: number;
  date: Date;
  amount: number;
  sourceKey: 'client_payment' | string;
  sourceLabel: string;
  clientName?: string;
  note: string;
  address?: string;
}

interface IncomeLedgerTableProps {
  incomes: IncomeItem[];
  dict: any;
}

export function IncomeLedgerTable({ incomes, dict }: IncomeLedgerTableProps) {
  const { sortedData: sortedIncomes, sortKey, sortDirection, toggleSort } = useSortableTable(incomes);

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <SortableTableHead 
            sortKey="date" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.date}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="sourceLabel" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.source}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="clientName" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.details || "Batafsil"}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="amount" 
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
        {sortedIncomes.slice(0, 50).map((income) => (
          <TableRow key={income.id}>
            <TableCell className="text-xs text-slate-500">{format(new Date(income.date), 'dd.MM.yyyy')}</TableCell>
            <TableCell>
              <span className={`capitalize text-xs font-semibold px-2 py-0.5 border rounded-md inline-flex ${income.sourceKey === 'client_payment'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                {income.sourceLabel}
              </span>
            </TableCell>
            <TableCell className="text-xs truncate max-w-[200px] font-medium text-slate-600">
              {income.type === 'order' ? (
                <span>
                  <strong>{income.clientName}</strong> {income.address ? `- ${income.address}` : ''}
                  {income.note && <em className="text-slate-400 block font-normal text-[10px] truncate max-w-[180px]">{income.note}</em>}
                </span>
              ) : (
                <span>
                  {income.note || '-'}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right text-sm text-emerald-600 font-extrabold">+{income.amount.toLocaleString()}</TableCell>
          </TableRow>
        ))}
        {sortedIncomes.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-slate-500 font-medium">
              {dict.no_income_found || "Daromadlar topilmadi."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
