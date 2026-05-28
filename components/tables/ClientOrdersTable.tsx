'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowLink } from '@/components/TableRowLink';
import { useSortableTable } from '@/hooks/use-sortable-table';

export function ClientOrdersTable({ clientOrders, dict }: { clientOrders: any[], dict: any }) {
  const enrichedOrders = clientOrders.map((o: any) => ({
    ...o,
    orderId: o.order.id,
    scheduledAt: o.order.scheduledAt,
    driverName: o.driver?.name || '',
    statusStr: dict[o.order.status as keyof typeof dict] || o.order.status.replace('_', ' '),
    amount: o.order.paymentAmount,
  }));

  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(enrichedOrders);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead sortKey="orderId" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            ID
          </SortableTableHead>
          <SortableTableHead sortKey="scheduledAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.scheduled_date}
          </SortableTableHead>
          <SortableTableHead sortKey="driverName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.driver}
          </SortableTableHead>
          <SortableTableHead sortKey="statusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.status}
          </SortableTableHead>
          <SortableTableHead sortKey="amount" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="text-right justify-end">
            {dict.amount}
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item: any) => (
          <TableRowLink href={`/orders/${item.order.id}`} key={item.order.id}>
            <TableCell className="font-medium text-slate-500">#{item.order.id}</TableCell>
            <TableCell>
              <div className="font-semibold text-slate-800">
                {format(new Date(item.order.scheduledAt), 'dd.MM.yyyy')}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {format(new Date(item.order.scheduledAt), 'HH:mm')}
              </div>
            </TableCell>
            <TableCell>{item.driver?.name || <span className="text-muted-foreground italic">{dict.unassigned}</span>}</TableCell>
            <TableCell>
              <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                {item.statusStr}
              </span>
            </TableCell>
            <TableCell className="text-right font-medium">{item.order.paymentAmount.toLocaleString()} RUB</TableCell>
          </TableRowLink>
        ))}
      </TableBody>
    </Table>
  );
}
