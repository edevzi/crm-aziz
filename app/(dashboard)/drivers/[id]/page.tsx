import React from 'react';
import { db } from '@/lib/db';
import { drivers, orders, clients } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Car,
  Calendar,
  User,
  Package,
  CheckCircle2,
  Clock,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { DriverOrdersTable } from '@/components/tables/DriverOrdersTable';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 15;

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const driverId = parseInt(params.id);

  if (isNaN(driverId)) return notFound();

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!driver) return notFound();

  // Fetch all driver orders with client info
  const allDriverOrders = await db
    .select({ order: orders, client: clients })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(eq(orders.driverId, driverId))
    .orderBy(desc(orders.createdAt));

  // --- Filter params ---
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : '';
  const paymentFilter = typeof searchParams.payment === 'string' ? searchParams.payment : '';
  const page = Math.max(1, parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1);
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

  // Apply filters
  let filtered = allDriverOrders;
  if (statusFilter === 'active') {
    // All non-closed and non-completed orders
    filtered = filtered.filter(r => !r.order.isClosed && r.order.status !== 'completed');
  } else if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(r => r.order.status === statusFilter);
  }
  if (paymentFilter && paymentFilter !== 'all') {
    filtered = filtered.filter(r => r.order.paymentStatus === paymentFilter);
  }
  
  if (from) {
    filtered = filtered.filter(r => new Date(r.order.scheduledAt) >= new Date(from));
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    filtered = filtered.filter(r => new Date(r.order.scheduledAt) < toDate);
  }

  // Stats from ALL orders (no filter)
  const totalOrders = allDriverOrders.length;
  const completedOrders = allDriverOrders.filter(r => r.order.status === 'completed').length;
  const totalRevenue = allDriverOrders
    .filter(r => r.order.status === 'completed')
    .reduce((sum, r) => sum + (r.order.driverFee || 0), 0);
  const activeOrders = allDriverOrders.filter(r => !r.order.isClosed && r.order.status !== 'completed').length;

  // Build URL helper preserving filters
  const buildUrl = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (statusFilter) p.set('status', statusFilter);
    if (paymentFilter) p.set('payment', paymentFilter);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    p.set('page', '1'); // reset page when clicking filters
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === '' || v === undefined) p.delete(k);
      else p.set(k, String(v));
    });
    const qs = p.toString();
    return `/drivers/${driverId}${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href="/drivers">
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{driver.name}</h1>
            <p className="text-slate-500 mt-1 font-medium">
              {"Профиль водителя и история заказов"}
            </p>
          </div>
        </div>
      </div>

      {/* Top Grid: Driver Info Card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Driver Info */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-white lg:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {"Данные водителя"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.phone}</p>
                <p className="font-bold text-slate-800">{driver.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Car className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.vehicle_plate}</p>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-sm font-bold text-slate-700">
                  {driver.vehiclePlate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.joined_date}</p>
                <p className="font-bold text-slate-800">{format(new Date(driver.createdAt), 'dd.MM.yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Orders */}
          <Link href={`/drivers/${driverId}`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Package className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-blue-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                {"Всего"}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight">{totalOrders}</div>
              <p className="text-xs font-semibold text-blue-100 mt-1">
                {"Все заказы"}
              </p>
            </div>
          </Link>

          {/* Completed */}
          <Link href={`/drivers/${driverId}?status=completed`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <CheckCircle2 className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                {totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : '0%'}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight">{completedOrders}</div>
              <p className="text-xs font-semibold text-emerald-100 mt-1">
                {"Завершено"}
              </p>
            </div>
          </Link>

          {/* Active */}
          <Link href={`/drivers/${driverId}?status=active`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Clock className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                {"Активно"}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight">{activeOrders}</div>
              <p className="text-xs font-semibold text-amber-100 mt-1">
                {"В работе"}
              </p>
            </div>
          </Link>

          {/* Revenue */}
          <Link href={`/drivers/${driverId}?status=completed`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-purple-500 shadow-lg shadow-violet-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <TrendingUp className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-violet-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">RUB</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight leading-tight">
                {totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs font-semibold text-violet-100 mt-1">
                {"Заработано водителем"}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Orders Table Card */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white">
        {/* Card Header + Filter Bar */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-0 pt-5 px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-primary" />
              {"Все заказы"}
              <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-1">
                {filtered.length}
              </span>
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                {/* Status Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: '', label: 'Все', color: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
                    { value: 'new', label: 'Новые', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200' },
                    { value: 'in_progress', label: 'В пути', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
                    { value: 'completed', label: 'Завершены', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
                    { value: 'active', label: 'Активные', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200' },
                  ].map(opt => (
                    <Link
                      key={opt.value || 'all'}
                      href={buildUrl({ status: opt.value })}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${opt.color} ${statusFilter === opt.value ? 'ring-2 ring-offset-1 ring-primary/40 shadow-sm opacity-100' : 'opacity-75 hover:opacity-100'}`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Payment Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: '', label: 'Все оплаты' },
                    { value: 'pending', label: 'Ожидает' },
                    { value: 'received', label: 'Получен' },
                    { value: 'entered', label: 'Учтён' },
                  ].map(opt => (
                    <Link
                      key={opt.value || 'all-payment'}
                      href={buildUrl({ payment: opt.value })}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${
                        paymentFilter === opt.value
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="w-px h-5 bg-slate-200 hidden lg:block" />
              
              <div className="w-full lg:w-auto">
                <DashboardDatePicker />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DriverOrdersTable 
            orders={filtered}
            page={page}
            limit={PAGE_SIZE}
            dict={dict}
            isUz={false}
          />
          <Pagination totalItems={filtered.length} itemsPerPage={PAGE_SIZE} />
        </CardContent>
      </Card>
    </div>
  );
}

