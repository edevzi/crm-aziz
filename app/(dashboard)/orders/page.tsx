import React, { Suspense } from 'react';
import { getOrders, getClients, getDrivers, getDispatchers } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { ClipboardList } from 'lucide-react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { StatusTabs } from '@/components/StatusTabs';
import { AutoRefresh } from '@/components/AutoRefresh';
import { OrderForm } from '@/components/forms/OrderForm';
import { ExportButton } from '@/components/ExportButton';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { Pagination } from '@/components/Pagination';
import { OrdersTable } from '@/components/tables/OrdersTable';
import OrdersLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  // We immediately fetch static configuration metadata (clients, drivers, dispatchers)
  // for the actions buttons at the top right, but keep table fetching inside Suspense
  const [clients, drivers, dispatchers, activeOrders] = await Promise.all([
    getClients(),
    getDrivers(),
    getDispatchers(),
    getOrders('active', ''),
  ]);

  const activeCount = activeOrders.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-white to-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <ClipboardList className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.orders}</h1>
            <p className="text-slate-500 mt-1.5 font-medium flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              {`Всего активных: ${activeCount}`}
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <OrderForm dict={dict} clients={clients} drivers={drivers} dispatchers={dispatchers} activeOrders={activeOrders} />
        </div>
      </div>

      <AutoRefresh intervalMs={10000} />

      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 p-4 sm:p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
        <div className="overflow-x-auto pb-2 -mb-2 scrollbar-hide">
          <StatusTabs 
            options={[
              { value: 'active', label: 'Активные' },
              { value: 'pending_confirmation', label: 'Ожидает подтверждения' },
              { value: 'overdue_containers', label: 'Просроченные контейнеры' },
              { value: 'all', label: 'Все' },
              { value: 'new', label: dict.new },
              { value: 'assigned', label: dict.assigned },
              { value: 'in_progress', label: dict.in_progress },
              { value: 'container_placed', label: dict.container_placed },
              { value: 'picked_up', label: dict.picked_up },
              { value: 'completed', label: dict.completed },
            ]}
            defaultFilter="all"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-100 pt-4">
          <div className="w-full md:max-w-md">
            <SearchAndFilter
              dict={dict}
              hideFilter={true}
              placeholder={"Поиск по ID, Адресу, Клиенту или Водителю..."}
            />
          </div>
          <div className="w-full md:w-auto">
            <DashboardDatePicker />
          </div>
        </div>
      </div>

      <Suspense key={JSON.stringify(searchParams)} fallback={<OrdersLoading />}>
        <OrdersListContent 
          searchParams={searchParams} 
          dict={dict} 
          lang={lang} 
          clients={clients} 
          drivers={drivers} 
          dispatchers={dispatchers}
          activeOrders={activeOrders}
        />
      </Suspense>
    </div>
  );
}

import { isOverdue } from '@/lib/utils';

async function OrdersListContent({
  searchParams,
  dict,
  lang,
  clients,
  drivers,
  dispatchers,
  activeOrders,
}: {
  searchParams: { [key: string]: string | string[] | undefined },
  dict: any,
  lang: string,
  clients: any[],
  drivers: any[],
  dispatchers: any[],
  activeOrders: any[],
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : '';
  const status = statusParam || 'all';
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

  const allFetchedOrders = await getOrders(status === 'overdue_containers' ? 'all' : status, q, from, to);

  // Filter for overdue if needed
  const allOrders = status === 'overdue_containers' 
    ? allFetchedOrders.filter((o) => isOverdue(o.order))
    : allFetchedOrders;

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 10;

  const exportOrdersData = allOrders.map(({ order, client, driver }) => ({
    id: `#${order.id}`,
    client: order.isExternalVehicle 
      ? (`Сторонняя: ${order.externalDriverName || ''}`) 
      : (client?.name || '-'),
    address: order.address,
    date: format(new Date(order.scheduledAt), 'dd.MM.yyyy'),
    driver: order.isExternalVehicle ? (order.externalDriverName || '-') : (driver?.name || '-'),
    status: dict[order.status] || order.status,
    payment_status: dict[order.paymentStatus] || order.paymentStatus,
    amount: `${order.paymentAmount.toLocaleString()} RUB`
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'client', label: dict.client },
    { key: 'address', label: dict.address },
    { key: 'date', label: dict.scheduled_date },
    { key: 'driver', label: dict.driver },
    { key: 'status', label: dict.status },
    { key: 'payment_status', label: dict.payment_status },
    { key: 'amount', label: dict.amount }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end -mb-2">
        <ExportButton 
          data={exportOrdersData} 
          columns={exportColumns} 
          filename="orders_report" 
          title={"Список заказов"} 
          dict={dict} 
        />
      </div>

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0">
          <OrdersTable 
            orders={allOrders} 
            page={page} 
            limit={limit} 
            dict={dict} 
            lang={lang} 
            clients={clients} 
            drivers={drivers} 
            dispatchers={dispatchers} 
            activeOrders={activeOrders} 
          />
        </CardContent>
      </Card>

      <Pagination totalItems={allOrders.length} itemsPerPage={limit} />
    </div>
  );
}

