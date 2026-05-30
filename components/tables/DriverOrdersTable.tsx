'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow, SortableTableHead } from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Package, Hash, MapPin, User, Calendar, Circle, Banknote } from 'lucide-react';
import { useSortableTable } from '@/hooks/use-sortable-table';

const STATUS_CONFIG: Record<string, { label_ru: string; color: string }> = {
  new:                { label_ru: 'Новый',              color: 'bg-sky-50 text-sky-700 border-sky-200' },
  assigned:           { label_ru: 'Назначен',           color: 'bg-violet-50 text-violet-700 border-violet-200' },
  in_progress:        { label_ru: 'В пути',             color: 'bg-amber-50 text-amber-700 border-amber-200' },
  container_placed:   { label_ru: 'Контейнер уст.',     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  picked_up:          { label_ru: 'Забран',             color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:          { label_ru: 'Завершён',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const PAYMENT_CONFIG: Record<string, { label_ru: string; color: string }> = {
  pending:  { label_ru: 'Ожидает',  color: 'bg-slate-50 text-slate-500 border-slate-200' },
  received: { label_ru: 'Получен',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  entered:  { label_ru: 'Учтён',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export function DriverOrdersTable({
  orders,
  page,
  limit,
  dict,
}: any) {
  const enrichedOrders = orders.map((o: any) => ({
    ...o,
    orderId: o.order.id,
    address: o.order.address,
    clientName: o.order.isExternalVehicle ? (o.order.externalDriverName || 'Сторонняя машина') : (o.client?.name || ''),
    scheduledAt: o.order.scheduledAt,
    statusStr: STATUS_CONFIG[o.order.status]?.label_ru || o.order.status,
    paymentStatusStr: PAYMENT_CONFIG[o.order.paymentStatus]?.label_ru || o.order.paymentStatus,
    amount: o.order.driverFee || 0,
  }));

  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(enrichedOrders);
  
  const paginatedOrders = sortedData.slice((page - 1) * limit, page * limit);

  return (
    <Table>
      <TableHeader className="bg-slate-50/80">
        <TableRow>
          <SortableTableHead sortKey="orderId" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[70px] pl-6">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              ID
            </div>
          </SortableTableHead>
          <SortableTableHead sortKey="address" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {dict.address}
            </div>
          </SortableTableHead>
          <SortableTableHead sortKey="clientName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="hidden sm:table-cell">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Клиент
            </div>
          </SortableTableHead>
          <SortableTableHead sortKey="scheduledAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {dict.scheduled_date}
            </div>
          </SortableTableHead>
          <SortableTableHead sortKey="statusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            <div className="flex items-center gap-1.5">
              <Circle className="h-3.5 w-3.5 text-slate-400" />
              {dict.status}
            </div>
          </SortableTableHead>
          <SortableTableHead sortKey="paymentStatusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="hidden md:table-cell">
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-slate-400" />
              Оплата
            </div>
          </SortableTableHead>
          <SortableTableHead sortKey="amount" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="text-right hidden lg:table-cell pr-6">
            <div className="flex items-center justify-end">
              Зарплата
            </div>
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedOrders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-16">
              <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">
                Заказы не найдены
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Измените условия фильтра
              </p>
            </TableCell>
          </TableRow>
        ) : (
          paginatedOrders.map(({ order, client }: any) => {
            const statusCfg = STATUS_CONFIG[order.status];
            const paymentCfg = PAYMENT_CONFIG[order.paymentStatus];
            return (
              <TableRow
                key={order.id}
                className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
              >
                <TableCell className="pl-6">
                  <Link href={`/orders/${order.id}`} className="block">
                    <span className="font-bold text-primary text-sm group-hover:underline">#{order.id}</span>
                    {order.isClosed && (
                      <span className="block text-[10px] font-bold text-slate-400 mt-0.5">
                        Закрыт
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/orders/${order.id}`} className="block">
                    <span className="font-semibold text-slate-800 text-sm truncate max-w-[160px] block">
                      {order.address}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {order.containerSizeM3} м³ · {order.rentalDuration?.replace('_', ' ')}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Link href={`/orders/${order.id}`} className="block">
                    {order.isExternalVehicle ? (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Стороннее авто
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-700">
                        {client?.name || <span className="text-slate-300">—</span>}
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/orders/${order.id}`} className="block">
                    <div className="font-bold text-slate-800 text-sm">
                      {format(new Date(order.scheduledAt), 'dd.MM.yyyy')}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {format(new Date(order.scheduledAt), 'HH:mm')}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/orders/${order.id}`} className="block">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${statusCfg?.color || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {statusCfg?.label_ru || order.status.replace('_', ' ')}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Link href={`/orders/${order.id}`} className="block">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex ${paymentCfg?.color || ''}`}>
                      {paymentCfg?.label_ru || order.paymentStatus}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell pr-6">
                  <Link href={`/orders/${order.id}`} className="block">
                    <span className="font-extrabold text-slate-800 text-sm">
                      {(order.driverFee || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1 font-semibold">RUB</span>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
