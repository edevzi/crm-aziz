import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getDrivers, getDashboardData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { Car } from 'lucide-react';
import { DriverForm } from '@/components/forms/DriverForm';
import { ExportButton } from '@/components/ExportButton';
import { DriversTable } from '@/components/tables/DriversTable';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';

export const dynamic = 'force-dynamic';

export default async function DriversPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  const allDrivers = await getDrivers();
  const allOrders = await getDashboardData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;
  
  let filteredDrivers = allDrivers;
  if (q) {
    const num = parseInt(q.replace('#', ''));
    filteredDrivers = allDrivers.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.phone.toLowerCase().includes(q) || 
      d.vehiclePlate.toLowerCase().includes(q) ||
      (!isNaN(num) && d.id === num)
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

  const statsByDriver: Record<number, { total: number; active: number }> = {};
  allOrdersFiltered.forEach(o => {
    if (o.driverId) {
      if (!statsByDriver[o.driverId]) statsByDriver[o.driverId] = { total: 0, active: 0 };
      statsByDriver[o.driverId].total++;
      if (o.status !== 'completed') statsByDriver[o.driverId].active++;
    }
  });

  if (from || to) {
    filteredDrivers = filteredDrivers.filter(d => statsByDriver[d.id]?.total > 0);
  }

  const enrichedDrivers = filteredDrivers.map(d => ({
    ...d,
    activeOrders: statsByDriver[d.id]?.active || 0,
    totalOrders: statsByDriver[d.id]?.total || 0,
    fromParam: from,
    toParam: to,
  }));

  const exportDriversData = enrichedDrivers.map(d => ({
    id: `#${d.id}`,
    name: d.name,
    phone: d.phone,
    vehicle_plate: d.vehiclePlate,
    active_orders: d.activeOrders,
    total_orders: d.totalOrders,
    joined_date: format(new Date(d.createdAt), 'dd.MM.yyyy')
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: dict.name },
    { key: 'phone', label: dict.phone },
    { key: 'vehicle_plate', label: dict.vehicle_plate },
    { key: 'active_orders', label: dict.active_orders },
    { key: 'total_orders', label: dict.total_orders },
    { key: 'joined_date', label: dict.joined_date || "Sana" }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.drivers}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.manage_drivers}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={exportDriversData} 
            columns={exportColumns} 
            filename="drivers_report" 
            title={"Список водителей"} 
            dict={dict} 
          />
          <DriverForm dict={dict} />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:max-w-md">
          <SearchAndFilter 
            dict={dict} 
            hideFilter={true} 
            placeholder={"Поиск по имени, телефону, номеру авто или ID..."} 
          />
        </div>
        <div className="w-full md:w-auto">
          <DashboardDatePicker />
        </div>
      </div>

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0 overflow-x-auto">
          <DriversTable drivers={enrichedDrivers} dict={dict} lang={lang} />
        </CardContent>
      </Card>
    </div>
  );
}
