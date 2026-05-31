'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowLink } from '@/components/TableRowLink';
import { OrderForm } from '@/components/forms/OrderForm';
import { ConfirmPaymentButton } from '@/components/ConfirmPaymentButton';
import { CompleteOrderButton } from '@/components/CompleteOrderButton';
import { OrderPhotoViewer } from '@/components/OrderPhotoViewer';
import { Phone } from 'lucide-react';
import { useSortableTable } from '@/hooks/use-sortable-table';

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'container_placed': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'picked_up': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getPaymentClasses = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'received': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'entered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export function OrdersTable({ 
  orders, 
  page, 
  limit, 
  dict, 
  lang, 
  clients, 
  drivers, 
  dispatchers, 
  activeOrders 
}: any) {
  const enrichedOrders = orders.map((o: any) => ({
    ...o,
    orderId: o.order.id,
    clientName: o.order.isExternalVehicle ? (o.order.externalDriverName || 'Сторонняя машина') : (o.client?.name || '-'),
    address: o.order.address,
    scheduledAt: o.order.scheduledAt,
    driverName: o.order.isExternalVehicle ? (o.order.externalDriverName || 'Сторонняя машина') : (o.driver?.name || ''),
    statusStr: dict[o.order.status as keyof typeof dict] || o.order.status.replace('_', ' '),
    paymentStatusStr: dict[o.order.paymentStatus as keyof typeof dict] || o.order.paymentStatus,
    amount: o.order.paymentAmount,
  }));

  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(enrichedOrders);
  
  const paginatedOrders = sortedData.slice((page - 1) * limit, page * limit);

  return (
    <Table className="table-fixed min-w-[1200px]">
      <TableHeader className="bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-10 shadow-sm">
        <TableRow className="hover:bg-transparent border-none">
          <SortableTableHead sortKey="orderId" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="pl-6 w-[100px]">
            ID
          </SortableTableHead>
          <SortableTableHead sortKey="clientName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[180px]">
            {dict.client}
          </SortableTableHead>
          <SortableTableHead sortKey="address" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[200px]">
            {dict.address}
          </SortableTableHead>
          <SortableTableHead sortKey="scheduledAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[130px]">
            {dict.scheduled_date}
          </SortableTableHead>
          <SortableTableHead sortKey="driverName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[150px]">
            {dict.driver}
          </SortableTableHead>
          <SortableTableHead sortKey="statusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[140px]">
            {dict.status}
          </SortableTableHead>
          <SortableTableHead sortKey="paymentStatusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="w-[140px]">
            {dict.payment}
          </SortableTableHead>
          <SortableTableHead sortKey="amount" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="text-right justify-end w-[120px]">
            {dict.amount}
          </SortableTableHead>
          <SortableTableHead sortKey="" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={() => {}} className="w-[60px] pr-6"></SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-slate-100/60">
        {paginatedOrders.map(({ order, client, driver, dispatcher, operator }: any) => (
          <TableRowLink href={`/orders/${order.id}`} key={order.id} className="group hover:bg-slate-50/60 transition-colors duration-200">
            <TableCell className="font-medium text-slate-500 pl-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">#{order.id}</span>
              </div>
              {operator && (
                <div className="text-[10px] text-slate-400 font-semibold mt-1.5 truncate max-w-[85px] flex items-center gap-1" title={`${'Оператор'}: ${operator.name}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                  {operator.name}
                </div>
              )}
            </TableCell>
            <TableCell className="py-4">
              {order.isExternalVehicle ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                    {'Сторонняя'}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{order.externalDriverName || 'Сторонняя машина'}</span>
                </div>
              ) : (
                <>
                  <div className="font-semibold text-slate-800 text-sm">{client?.name}</div>
                  {dispatcher && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 mt-1 bg-indigo-50 w-fit px-1.5 py-0.5 rounded-md border border-indigo-100">
                      <Phone className="h-3 w-3" />
                      {dispatcher.name}
                    </div>
                  )}
                </>
              )}
            </TableCell>
            <TableCell className="py-4">
              <div className="truncate max-w-[200px] text-sm text-slate-700 font-medium">{order.address}</div>
              {order.containerNumber && (
                <div className="text-[11px] text-slate-500 font-mono mt-1 bg-slate-100 w-fit px-1.5 py-0.5 rounded-md border border-slate-200">#{order.containerNumber}</div>
              )}
            </TableCell>
            <TableCell>
              <div className="font-semibold text-slate-800">
                {format(new Date(order.scheduledAt), 'dd.MM.yyyy')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {format(new Date(order.scheduledAt), 'HH:mm')}
              </div>
            </TableCell>
            <TableCell className="py-4">
              {order.isExternalVehicle ? (
                <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-sm border border-orange-100">{order.externalDriverName || 'Сторонняя машина'}</span>
              ) : (
                <span className="font-semibold text-slate-700">{driver?.name || <span className="text-slate-400 italic font-normal">{dict.unassigned}</span>}</span>
              )}
            </TableCell>
            <TableCell className="py-4">
              <div className="flex flex-col gap-2 items-start">
                <span className={`inline-flex items-center text-[11px] font-black uppercase tracking-wider border rounded-full px-2.5 py-1 ${getStatusClasses(order.status)}`}>
                  {dict[order.status] || order.status.replace('_', ' ')}
                </span>
                {order.status === 'picked_up' && (
                  <CompleteOrderButton orderId={order.id} />
                )}
                {order.photoUrl && (
                  <OrderPhotoViewer photoUrl={order.photoUrl} variant="thumbnail" />
                )}
              </div>
            </TableCell>
            <TableCell className="py-4">
              <div className="flex flex-col gap-2">
                {order.paymentType !== 'cash' ? (
                  <>
                    <span className={`inline-flex items-center w-fit text-[11px] font-bold border rounded-full px-2.5 py-1 ${order.paymentStatus === 'entered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                      {order.paymentStatus === 'entered' ? 'Оплачено (Безнал)' : 'Безнал (Ожидание)'}
                    </span>
                    <ConfirmPaymentButton orderId={order.id} currentStatus={order.paymentStatus} />
                  </>
                ) : (
                  <>
                    <span className={`inline-flex items-center w-fit text-[11px] font-bold border rounded-full px-2.5 py-1 ${getPaymentClasses(order.paymentStatus)}`}>
                      {dict[order.paymentStatus] || order.paymentStatus}
                    </span>
                    <ConfirmPaymentButton orderId={order.id} currentStatus={order.paymentStatus} />
                  </>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right py-4">
              <div className="font-black text-slate-800 text-sm">{order.paymentAmount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">RUB</div>
            </TableCell>
            <TableCell className="text-right flex items-center justify-end pr-6 py-4 opacity-100 group-hover:opacity-100 transition-opacity">
              <OrderForm dict={dict} order={order} clients={clients} drivers={drivers} dispatchers={dispatchers} activeOrders={activeOrders} />
            </TableCell>
          </TableRowLink>
        ))}
        {paginatedOrders.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-slate-500">
              {"Заказы не найдены."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
