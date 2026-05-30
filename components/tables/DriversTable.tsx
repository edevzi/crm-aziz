'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowLink } from '@/components/TableRowLink';
import { DriverForm } from '@/components/forms/DriverForm';
import { useSortableTable } from '@/hooks/use-sortable-table';

export function DriversTable({ drivers, dict, lang }: { drivers: any[], dict: any, lang: any }) {
  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(drivers);

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
          <SortableTableHead sortKey="vehiclePlate" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.vehicle_plate}
          </SortableTableHead>
          <SortableTableHead sortKey="activeOrders" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.active_orders}
          </SortableTableHead>
          <SortableTableHead sortKey="totalOrders" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.total_orders}
          </SortableTableHead>
          <SortableTableHead sortKey="createdAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.joined_date || "Дата"}
          </SortableTableHead>
          <SortableTableHead sortKey="" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={() => {}} className="w-10"></SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((driver) => {
          const params = new URLSearchParams();
          if (driver.fromParam) params.set('from', driver.fromParam);
          if (driver.toParam) params.set('to', driver.toParam);
          const qs = params.toString();
          const href = `/drivers/${driver.id}${qs ? `?${qs}` : ''}`;

          return (
            <TableRowLink href={href} key={driver.id}>
              <TableCell className="font-medium text-slate-500">#{driver.id}</TableCell>
              <TableCell className="font-semibold">{driver.name}</TableCell>
              <TableCell>{driver.phone}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-slate-100 border rounded-md font-mono text-xs">
                  {driver.vehiclePlate}
                </span>
              </TableCell>
              <TableCell>
                <span className={`font-bold ${driver.activeOrders > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {driver.activeOrders}
                </span>
              </TableCell>
              <TableCell className="font-medium text-slate-600">
                {driver.totalOrders}
              </TableCell>
              <TableCell>{format(new Date(driver.createdAt), 'dd.MM.yyyy')}</TableCell>
              <TableCell className="text-right">
                <DriverForm dict={dict} driver={driver} />
              </TableCell>
            </TableRowLink>
          );
        })}
        {sortedData.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-slate-500">
              {"Водители не найдены."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
