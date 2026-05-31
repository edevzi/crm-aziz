import React from 'react';
import { db } from '@/lib/db';
import { clients, orders, drivers } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ClientOrdersTable } from '@/components/tables/ClientOrdersTable';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';

export default async function ClientDetailPage({ 
  params,
  searchParams,
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const clientId = parseInt(params.id);

  if (isNaN(clientId)) return notFound();

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);

  if (!client) return notFound();

  const allClientOrders = await db.select({
    order: orders,
    driver: drivers,
  })
  .from(orders)
  .leftJoin(drivers, eq(orders.driverId, drivers.id))
  .where(eq(orders.clientId, clientId))
  .orderBy(desc(orders.createdAt));

  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

  let clientOrders = allClientOrders;
  if (from) {
    clientOrders = clientOrders.filter(r => new Date(r.order.scheduledAt) >= new Date(from));
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    clientOrders = clientOrders.filter(r => new Date(r.order.scheduledAt) < toDate);
  }

  let totalSpent = 0;
  clientOrders.forEach(({ order }) => {
    totalSpent += order.paymentAmount;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="outline" size="icon" asChild className="flex-shrink-0">
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">{client.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{dict.manage_clients} - {dict.details}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{dict.client} {dict.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{dict.phone}</p>
              <p className="font-medium text-lg">{client.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.address}</p>
              <p className="font-medium">{client.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.registered}</p>
              <p className="font-medium">{format(new Date(client.createdAt), 'dd.MM.yyyy')}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{dict.total_orders}</p>
              <p className="font-bold text-xl text-blue-700">{clientOrders.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.total_spent}</p>
              <p className="font-bold text-xl text-green-700">{totalSpent.toLocaleString()} RUB</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <CardTitle>{dict.orders} ({clientOrders.length})</CardTitle>
            <DashboardDatePicker />
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {clientOrders.length > 0 ? (
              <ClientOrdersTable clientOrders={clientOrders} dict={dict} />
            ) : (
              <p className="text-muted-foreground text-center py-4">{dict.no_orders_found}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
