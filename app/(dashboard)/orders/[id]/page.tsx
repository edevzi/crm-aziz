import React from 'react';
import { db } from '@/lib/db';
import { orders, clients, drivers, dispatchers, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowLeft, MapPin, User, Truck, CreditCard, ExternalLink, Phone, Package } from 'lucide-react';
import { notFound } from 'next/navigation';
import { OrderStatusUpdater } from '@/components/OrderStatusUpdater';
import { PaymentStatusUpdater } from '@/components/PaymentStatusUpdater';
import { OrderPhotoViewer } from '@/components/OrderPhotoViewer';



export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const lang: string = 'ru';
  const dict = getDictionary(lang);
  const orderId = parseInt(params.id);

  if (isNaN(orderId)) return notFound();

  const [orderData] = await db.select({
    order: orders,
    client: clients,
    driver: drivers,
    dispatcher: dispatchers,
    operator: users,
  })
  .from(orders)
  .leftJoin(clients, eq(orders.clientId, clients.id))
  .leftJoin(drivers, eq(orders.driverId, drivers.id))
  .leftJoin(dispatchers, eq(orders.dispatcherId, dispatchers.id))
  .leftJoin(users, eq(orders.operatorId, users.id))
  .where(eq(orders.id, orderId))
  .limit(1);

  if (!orderData) return notFound();

  const { order, client, driver, dispatcher, operator } = orderData;

  const addressMapUrl = order.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="outline" size="icon" asChild className="flex-shrink-0">
          <Link href="/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{dict.order} #{order.id}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm sm:text-base">{dict.manage_orders}</p>
            {dispatcher && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                <Phone className="h-3 w-3" /> {'Диспетчер'}
              </span>
            )}
          </div>
        </div>
      </div>

      {order.isExternalVehicle ? (
        <div className="bg-orange-50/50 border border-orange-200/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl mb-8">
          <div>
            <h3 className="text-lg font-bold text-orange-900">{'Заказ сторонней машины'}</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              {'Этот заказ автоматически завершен, внесен и закрыт.'}
            </p>
          </div>
          <span className="inline-flex items-center text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-4 py-1.5 self-start sm:self-auto">
            {dict.completed}
          </span>
        </div>
      ) : (
        <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl mb-8">
          <CardContent className="p-3 sm:p-8">
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} dict={dict} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Client Card */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900">
            <User className="w-24 h-24" />
          </div>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="flex flex-wrap items-center gap-2">
              {dict.client}
              {dispatcher && (
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{'Диспетчер'}</span>
              )}
              {order.isExternalVehicle && (
                <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {'Сторонняя машина'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 relative z-10">
            {order.isExternalVehicle ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.driver}</p>
                  <p className="font-extrabold text-xl text-orange-600">{order.externalDriverName || ('Неизвестно')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{'Тип автомобиля'}</p>
                  <p className="font-bold text-lg text-slate-700">{'Сторонняя машина'}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.name}</p>
                  <p className="font-extrabold text-xl">{client?.name || ('Нет данных')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.phone}</p>
                  <a href={`tel:${client?.phone}`} className="font-bold text-lg text-primary hover:underline">{client?.phone || ('Нет телефона')}</a>
                </div>
                {/* Dispatcher info */}
                {dispatcher && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-1">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{'Диспетчер'}</p>
                    <p className="font-bold text-slate-800">{dispatcher.name}</p>
                    <a href={`tel:${dispatcher.phone}`} className="text-sm font-semibold text-indigo-600 hover:underline">{dispatcher.phone}</a>
                    {order.dispatcherFee && (
                      <p className="text-sm font-bold text-slate-700 pt-1">
                        {'Услуга:'} <span className="text-indigo-700">{order.dispatcherFee.toLocaleString()} RUB</span>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Details Card */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900">
            <Truck className="w-24 h-24" />
          </div>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>{dict.order} {dict.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 relative z-10">
            {/* Address + Map link */}
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.address}</p>
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <p className="font-semibold text-slate-800 flex-1 break-words">{order.address}</p>
                <a
                  href={addressMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm self-start"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {'Навигация'}
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.scheduled_date}</p>
                <p className="font-bold text-base sm:text-lg">{format(new Date(order.scheduledAt), 'dd.MM.yyyy')}</p>
                <p className="text-sm font-medium text-slate-500">{format(new Date(order.scheduledAt), 'HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.container_size}</p>
                <p className="font-bold text-lg">{order.containerSizeM3} m³</p>
                {order.containerNumber && (
                  <p className="text-xs font-mono font-semibold text-slate-500 mt-0.5">
                    <Package className="h-3 w-3 inline mr-1" />#{order.containerNumber}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.rental_duration}</p>
                <p className="font-bold text-lg">{order.rentalDuration}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.driver}</p>
                <p className="font-bold text-lg text-primary">
                  {order.isExternalVehicle ? (
                    <span className="text-orange-600 font-bold">{order.externalDriverName || ('Сторонняя')}</span>
                  ) : (
                    driver?.name || <span className="text-slate-400 italic">{dict.unassigned}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{'Оператор'}</p>
                <p className="font-bold text-lg text-slate-700">{operator?.name || <span className="text-slate-400 italic">{'Неизвестно'}</span>}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.operator_note}</p>
              <p className="font-semibold text-slate-700 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 break-words">{order.operatorNote || dict.no_notes}</p>
            </div>
            
            {order.photoUrl && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Фото с места</p>
                <OrderPhotoViewer photoUrl={order.photoUrl} variant="preview" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finance Card */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden relative md:col-span-2 bg-gradient-to-br from-emerald-50/30 to-white">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-900">
            <CreditCard className="w-32 h-32" />
          </div>
          <CardHeader className="bg-white/50 backdrop-blur border-b border-slate-100">
            <CardTitle>{dict.finance}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-start sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.amount}</p>
                <p className="font-extrabold text-2xl sm:text-4xl text-emerald-600">{order.paymentAmount.toLocaleString()} <span className="text-sm sm:text-lg opacity-70">RUB</span></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.payment}</p>
                <p className="font-bold text-base sm:text-xl capitalize text-slate-700">{dict[order.paymentType as keyof typeof dict] || order.paymentType}</p>
              </div>
              {order.dispatcherFee ? (
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{'Услуга диспетчера'}</p>
                  <p className="font-bold text-base sm:text-xl text-indigo-600">{order.dispatcherFee.toLocaleString()} <span className="text-sm opacity-70">RUB</span></p>
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">{dict.payment_status}</p>
                {order.isExternalVehicle ? (
                  <span className="inline-flex items-center text-xs font-bold border rounded-full px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    {dict.entered}
                  </span>
                ) : order.paymentType !== 'cash' ? (
                  <span className="inline-flex items-center text-xs font-bold border rounded-full px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    {'Оплачено (Безнал)'}
                  </span>
                ) : (
                  <PaymentStatusUpdater orderId={order.id} currentStatus={order.paymentStatus} dict={dict} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
