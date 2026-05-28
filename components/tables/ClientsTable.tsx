'use client';

import React from 'react';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowLink } from '@/components/TableRowLink';
import { ClientForm } from '@/components/forms/ClientForm';
import { useSortableTable } from '@/hooks/use-sortable-table';

export function ClientsTable({ clients, dict, lang }: { clients: any[], dict: any, lang: any }) {
  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(clients);

  return (
    <Table>
      <TableHeader className="bg-slate-50/80 border-b border-slate-100">
        <TableRow className="hover:bg-transparent">
          <SortableTableHead sortKey="id" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            ID
          </SortableTableHead>
          <SortableTableHead sortKey="name" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.name}
          </SortableTableHead>
          <SortableTableHead sortKey="phone" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.phone}
          </SortableTableHead>
          <SortableTableHead sortKey="address" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.address}
          </SortableTableHead>
          <SortableTableHead sortKey="statsCount" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="text-center justify-center">
            {dict.total_orders}
          </SortableTableHead>
          <SortableTableHead sortKey="statsSpent" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="text-right justify-end">
            {dict.total_spent}
          </SortableTableHead>
          <SortableTableHead sortKey="" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={() => { }} className="w-10"></SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((client) => {
          const params = new URLSearchParams();
          if (client.fromParam) params.set('from', client.fromParam);
          if (client.toParam) params.set('to', client.toParam);
          const qs = params.toString();
          const href = `/clients/${client.id}${qs ? `?${qs}` : ''}`;

          return (
            <TableRowLink href={href} key={client.id}>
              <TableCell className="font-medium text-slate-500">#{client.id}</TableCell>
              <TableCell className="font-semibold">{client.name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell className="truncate max-w-[200px]">{client.address}</TableCell>
              <TableCell className="text-center font-medium text-blue-600">
                {client.statsCount}
              </TableCell>
              <TableCell className="text-right font-medium text-green-600">
                {client.statsSpent.toLocaleString()} RUB
              </TableCell>
              <TableCell className="text-right">
                <ClientForm dict={dict} client={client} />
              </TableCell>
            </TableRowLink>
          );
        })}
        {sortedData.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
              {"Клиенты не найдены."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
