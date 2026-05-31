import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getClients, getDashboardData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { Users } from 'lucide-react';
import { ClientForm } from '@/components/forms/ClientForm';
import { ExportButton } from '@/components/ExportButton';
import { ClientsTable } from '@/components/tables/ClientsTable';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const allClients = await getClients();
  const allOrders = await getDashboardData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;
  
  let filteredClients = allClients;
  if (q) {
    const num = parseInt(q.replace('#', ''));
    filteredClients = allClients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q) || 
      c.address.toLowerCase().includes(q) ||
      (!isNaN(num) && c.id === num)
    );
  }

  let allOrdersFiltered = allOrders;
  if (from) {
    allOrdersFiltered = allOrdersFiltered.filter(r => new Date(r.scheduledAt) >= new Date(from));
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    allOrdersFiltered = allOrdersFiltered.filter(r => new Date(r.scheduledAt) < toDate);
  }

  const statsByClient: Record<number, { count: number, spent: number }> = {};
  allOrdersFiltered.forEach(o => {
    if (o.clientId !== null) {
      if (!statsByClient[o.clientId]) statsByClient[o.clientId] = { count: 0, spent: 0 };
      statsByClient[o.clientId].count++;
      statsByClient[o.clientId].spent += o.paymentAmount;
    }
  });

  if (from || to) {
    filteredClients = filteredClients.filter(c => statsByClient[c.id]?.count > 0);
  }

  const enrichedClients = filteredClients.map(c => ({
    ...c,
    statsCount: statsByClient[c.id]?.count || 0,
    statsSpent: statsByClient[c.id]?.spent || 0,
    fromParam: from,
    toParam: to,
  }));

  const exportClientsData = enrichedClients.map(c => ({
    id: `#${c.id}`,
    name: c.name,
    phone: c.phone,
    address: c.address,
    total_orders: c.statsCount,
    total_spent: `${c.statsSpent.toLocaleString()} RUB`
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: dict.name },
    { key: 'phone', label: dict.phone },
    { key: 'address', label: dict.address },
    { key: 'total_orders', label: dict.total_orders },
    { key: 'total_spent', label: dict.total_spent }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.clients}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.manage_clients}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={exportClientsData} 
            columns={exportColumns} 
            filename="clients_report" 
            title={"Список клиентов"} 
            dict={dict} 
          />
          <ClientForm dict={dict} />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:max-w-md">
          <SearchAndFilter 
            dict={dict} 
            hideFilter={true} 
            placeholder={"Поиск по имени, телефону, адресу или ID..."} 
          />
        </div>
        <div className="w-full md:w-auto">
          <DashboardDatePicker />
        </div>
      </div>

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0 overflow-x-auto">
          <ClientsTable clients={enrichedClients} dict={dict} lang={lang} />
        </CardContent>
      </Card>
    </div>
  );
}
