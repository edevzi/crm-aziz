'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { createOrder, updateOrder } from '@/app/actions/entities';
import { Plus, Edit2, MapPin, ExternalLink, Phone, User, Package, Clock, CreditCard, Truck, Navigation, Map as MapIcon, Banknote, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { YMaps, Map as YandexMap, Placemark, SearchControl, ZoomControl } from '@pbe/react-yandex-maps';

const formatDateOnly = (dateInput: any) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${d}.${mo}.${y}`;
};

const formatTimeOnly = (dateInput: any) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${mi}`;
};


const CONTAINER_SIZES = [8, 20, 27];
const RENTAL_PRESETS = ['2 часа', '24 часа', '1 день', '1 неделя', '1 месяц'];

const PAYMENT_TYPES = [
  { val: 'cash',   icon: Banknote,   label: 'Нал.' },
  { val: 'card',   icon: CreditCard, label: 'Безнал' },
];

interface Client     { id: number; name: string; phone: string; address: string; mapUrl?: string | null; }
interface Dispatcher { id: number; name: string; phone: string; }
interface Driver     { id: number; name: string; vehiclePlate: string; }

export function OrderForm({ dict, order, clients, drivers, dispatchers, activeOrders = [] }: {
  dict: any;
  order?: any;
  clients: Client[];
  drivers: Driver[];
  dispatchers: Dispatcher[];
  activeOrders?: any[];
}) {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<number[] | null>(null);
  const [ymapsInstance, setYmapsInstance] = useState<any>(null);
  const router = useRouter();

  const fresh = (): any => {
    if (order) {
      const client     = clients.find(c => c.id === order.clientId);
      const dispatcher = dispatchers.find(d => d.id === order.dispatcherId);
      return {
        clientId:        String(order.clientId || ''),
        clientName:      client?.name  || '',
        clientPhone:     client?.phone || '',
        clientAddress:   client?.address || '',
        clientMapUrl:    client?.mapUrl  || '',
        driverId:        String(order.driverId || ''),
        operatorNote:    order.operatorNote    || '',
        address:         order.address         || '',
        mapUrl:          order.mapUrl          || '',
        scheduledDate:   formatDateOnly(order.scheduledAt),
        scheduledTime:   formatTimeOnly(order.scheduledAt),
        containerSizeM3: String(order.containerSizeM3 || '8'),
        containerNumber: order.containerNumber || '',
        rentalDuration:  order.rentalDuration  || '1 день',
        paymentAmount:   String(order.paymentAmount || ''),
        paymentType:     order.paymentType     || 'cash',
        status:          order.status          || 'new',
        paymentStatus:   order.paymentStatus   || 'pending',
        clientCategory:  order.clientCategory  || 'direct',
        dispatcherId:    String(order.dispatcherId || ''),
        dispatcherName:  dispatcher?.name  || '',
        dispatcherPhone: dispatcher?.phone || '',
        dispatcherFee:   String(order.dispatcherFee || ''),
        referralName:    order.referralName    || '',
        referralPercent: String(order.referralPercent || ''),
        isExternalVehicle: order.isExternalVehicle || false,
        externalDriverName: order.externalDriverName || '',
      };
    }
    return {
      clientId: '', clientName: '', clientPhone: '', clientAddress: '', clientMapUrl: '',
      driverId: '', operatorNote: '', address: '', mapUrl: '',
      scheduledDate: formatDateOnly(new Date()),
      scheduledTime: formatTimeOnly(new Date()),
      containerSizeM3: '8', containerNumber: '',
      rentalDuration: '1 день',
      paymentAmount: '', paymentType: 'cash',
      status: 'new', paymentStatus: 'pending',
      clientCategory: 'direct',
      dispatcherId: '', dispatcherName: '', dispatcherPhone: '', dispatcherFee: '',
      referralName: '', referralPercent: '',
      isExternalVehicle: false,
      externalDriverName: '',
    };
  };

  const [form, setForm]     = useState(fresh);
  const [customRental, setCustomRental] = useState(!RENTAL_PRESETS.includes(order?.rentalDuration || '1 день'));

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  /* ── CLIENT SELECT ── */
  const selectClient = (id: string) => {
    if (!id || id === 'new') { set('clientId', id || ''); return; }
    const c = clients.find(x => String(x.id) === id);
    if (c) setForm((p: any) => ({ ...p, clientId: id, clientName: c.name, clientPhone: c.phone, clientAddress: c.address, clientMapUrl: c.mapUrl || '' }));
  };

  /* ── DISPATCHER SELECT ── */
  const selectDispatcher = (id: string) => {
    if (!id || id === 'new') { set('dispatcherId', id || ''); return; }
    const d = dispatchers.find(x => String(x.id) === id);
    if (d) setForm((p: any) => ({ ...p, dispatcherId: id, dispatcherName: d.name, dispatcherPhone: d.phone }));
  };

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    let formatted = val;
    if (val.length >= 3) formatted = val.slice(0, 2) + '.' + val.slice(2);
    if (val.length >= 5) formatted = formatted.slice(0, 5) + '.' + val.slice(4);
    set('scheduledDate', formatted);
  };

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    let formatted = val;
    if (val.length >= 3) formatted = val.slice(0, 2) + ':' + val.slice(2);
    set('scheduledTime', formatted);
  };

  /* ── NUMBER INPUTS ── */
  const onAmt = (val: string) => {
    set('paymentAmount', val);
  };
  const onDispAmt = (val: string) => {
    set('dispatcherFee', val);
  };

  /* ── SUBMIT ── */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const scheduledAtStr = `${form.scheduledDate} ${form.scheduledTime}`.trim();
      let isoString = scheduledAtStr;
      const match = scheduledAtStr.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const hour = match[4] ? parseInt(match[4], 10) : 0;
        const minute = match[5] ? parseInt(match[5], 10) : 0;
        isoString = new Date(year, month, day, hour, minute).toISOString();
      }

      const payload = { ...form, scheduledAt: isoString };
      const res = order ? await updateOrder(order.id, payload) : await createOrder(payload);
      if (res && !res.success) { setError(res.error); return; }
      setOpen(false);
      router.refresh();
      if (!order) { setForm(fresh()); setCustomRental(false); }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally { setLoading(false); }
  };

  const clientOptions     = clients.map(c => ({ value: String(c.id), label: c.name, sub: c.phone }));
  const dispatcherOptions = dispatchers.map(d => ({ value: String(d.id), label: d.name, sub: d.phone }));
  
  // Calculate driver availability
  const isDriverBusy = (dId: number) => {
    const scheduledAtStr = `${form.scheduledDate} ${form.scheduledTime}`.trim();
    if (!scheduledAtStr) return false;
    
    const match = scheduledAtStr.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
    let selectedTime = NaN;
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hour = match[4] ? parseInt(match[4], 10) : 0;
      const minute = match[5] ? parseInt(match[5], 10) : 0;
      selectedTime = new Date(year, month, day, hour, minute).getTime();
    } else {
      selectedTime = new Date(scheduledAtStr).getTime();
    }

    if (isNaN(selectedTime)) return false;

    // Buffer: 3 hours in milliseconds
    const BUFFER = 3 * 60 * 60 * 1000;

    for (const ao of activeOrders) {
      if (ao.order.driverId !== dId) continue;
      // Skip the current order being edited
      if (order && ao.order.id === order.id) continue;
      
      const orderTime = new Date(ao.order.scheduledAt).getTime();
      if (Math.abs(orderTime - selectedTime) <= BUFFER) {
        return true; // Conflict found
      }
    }
    return false;
  };

  const driverOptions     = [
    { value: 'none', label: dict.unassigned || 'Не назначен' },
    ...drivers.map(d => {
      const busy = isDriverBusy(d.id);
      return { 
        value: String(d.id), 
        label: d.name, 
        sub: d.vehiclePlate,
        disabled: busy 
      };
    }),
  ];
  const isDispatcher = form.clientCategory === 'dispatcher';

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        {order ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-2xl px-5 py-2.5 h-10 font-bold text-sm shadow-lg shadow-primary/25 gap-2 transition-all hover:scale-[1.02] hover:shadow-primary/40">
            <Plus className="h-4 w-4" />
            {dict.new_order}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl border border-slate-200/60 shadow-2xl bg-white">
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              {order ? <Edit2 className="h-4.5 w-4.5 text-primary" /> : <Plus className="h-4.5 w-4.5 text-primary" />}
            </div>
            <DialogTitle className="text-lg font-extrabold text-slate-900">
              {order ? 'Редактировать заказ' : dict.new_order}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="px-6 pb-6 pt-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 rounded-2xl">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              {error}
            </div>
          )}

          {/* ══ VEHICLE TYPE TOGGLE ══ */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            {([false, true] as const).map(isExt => (
              <button
                key={String(isExt)}
                type="button"
                onClick={() => setForm((p: any) => ({ ...p, isExternalVehicle: isExt }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  form.isExternalVehicle === isExt
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {!isExt
                  ? <><Truck className="h-4 w-4 text-emerald-500" /> Своя машина</>
                  : <><Truck className="h-4 w-4 text-orange-500" /> Сторонняя машина</>}
              </button>
            ))}
          </div>

          {form.isExternalVehicle ? (
            <>
              {/* External Driver Name */}
              <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Водитель сторонней машины
                </p>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">Имя водителя *</Label>
                  <Input value={form.externalDriverName} onChange={e => set('externalDriverName', e.target.value)} placeholder="Имя водителя" required={form.isExternalVehicle} className="h-9 rounded-xl text-sm" />
                </div>
              </section>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Дата *
                  </Label>
                  <Input type="text" value={form.scheduledDate} onChange={onDateChange} placeholder="ДД.ММ.ГГГГ"
                    required className="h-9 rounded-xl text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Время *
                  </Label>
                  <Input type="text" value={form.scheduledTime} onChange={onTimeChange} placeholder="ЧЧ:ММ"
                    required className="h-9 rounded-xl text-sm" />
                </div>
              </div>

              {/* Amount and Payment Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> {dict.amount} *
                  </Label>
                  <div className="relative">
                    <FormattedNumberInput placeholder="0" value={form.paymentAmount} onChange={onAmt}
                      className="h-9 rounded-xl text-sm font-bold pr-14" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">RUB</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">Тип оплаты *</Label>
                  <div className="grid grid-cols-2 gap-1.5 h-9">
                    {PAYMENT_TYPES.map(({ val, icon: Icon, label }) => (
                      <button key={val} type="button" onClick={() => set('paymentType', val)}
                        className={`h-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border transition-all ${
                          form.paymentType === val
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
                        }`}>
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ══ CATEGORY TOGGLE ══ */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                {(['direct', 'dispatcher'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('clientCategory', cat)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      form.clientCategory === cat
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat === 'direct'
                      ? <><User className="h-4 w-4 text-blue-500" /> Прямой клиент</>
                      : <><Phone className="h-4 w-4 text-indigo-500" /> Диспетчер</>}
                  </button>
                ))}
              </div>

              {/* ══ CLIENT ══ */}
              <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Клиент
                </p>
                <SearchableSelect
                  options={clientOptions}
                  value={form.clientId === 'new' ? '' : form.clientId}
                  onChange={selectClient}
                  placeholder="Поиск по клиентам..."
                  addNewLabel="+ Новый клиент"
                  onAddNew={() => selectClient('new')}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">Имя *</Label>
                    <Input value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Имя клиента" required={!form.isExternalVehicle} className="h-9 rounded-xl text-sm" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">Телефон *</Label>
                    <Input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="+998 90 000 00 00" required={!form.isExternalVehicle} className="h-9 rounded-xl text-sm" />
                  </div>
                </div>
              </section>

              {/* ══ DISPATCHER (conditional) ══ */}
              {isDispatcher && (
                <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Диспетчер
                  </p>
                  <SearchableSelect
                    options={dispatcherOptions}
                    value={form.dispatcherId === 'new' ? '' : form.dispatcherId}
                    onChange={selectDispatcher}
                    placeholder="Поиск диспетчера..."
                    addNewLabel="+ Новый диспетчер"
                    onAddNew={() => selectDispatcher('new')}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[11px] font-semibold text-indigo-500 mb-1 block">Имя</Label>
                      <Input value={form.dispatcherName} onChange={e => set('dispatcherName', e.target.value)} placeholder="Имя" className="h-9 rounded-xl text-sm" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-indigo-500 mb-1 block">Телефон</Label>
                      <Input value={form.dispatcherPhone} onChange={e => set('dispatcherPhone', e.target.value)} placeholder="+998 90 000 00 00" className="h-9 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-indigo-500 mb-1 block flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Услуга диспетчера (сумма)
                    </Label>
                    <div className="relative">
                      <FormattedNumberInput placeholder="0" value={form.dispatcherFee} onChange={onDispAmt}
                        className="h-9 rounded-xl text-sm font-semibold pr-14 bg-white" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">RUB</span>
                    </div>
                  </div>
                </section>
              )}

              {/* ══ ADDRESS + MAP ══ */}
              <section className="space-y-2.5">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" /> {dict.address} *
                  </Label>
                  <Input value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Адрес доставки" required={!form.isExternalVehicle} className="h-9 rounded-xl text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-blue-500" />
                      Ссылка на карту
                    </span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={(e) => { e.preventDefault(); setMapOpen(true); }}
                        className="text-emerald-600 text-[10px] font-bold hover:text-emerald-700 flex items-center gap-1">
                        <MapIcon className="h-3.5 w-3.5" /> На карте
                      </button>
                      {form.mapUrl && (
                        <a href={form.mapUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 text-[10px] font-bold hover:text-blue-700 flex items-center gap-0.5"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="h-3 w-3 opacity-70" /> {dict.open || 'Открыть'}
                        </a>
                      )}
                    </div>
                  </Label>
                  <Input value={form.mapUrl} onChange={e => set('mapUrl', e.target.value)}
                    placeholder="https://maps.google.com/... или yandex.ru/maps/..."
                    className="h-9 rounded-xl text-sm" />
                </div>
              </section>

              {/* ══ DATE + CONTAINER SIZE ══ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" /> Дата *
                    </Label>
                    <Input type="text" value={form.scheduledDate} onChange={onDateChange} placeholder="ДД.ММ.ГГГГ"
                      required className="h-9 rounded-xl text-sm" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-400 mb-1">
                      Время *
                    </Label>
                    <Input type="text" value={form.scheduledTime} onChange={onTimeChange} placeholder="ЧЧ:ММ"
                      required className="h-9 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-orange-500" /> {dict.container_size} *
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 h-9">
                    {CONTAINER_SIZES.map(s => (
                      <button key={s} type="button" onClick={() => set('containerSizeM3', String(s))}
                        className={`h-full rounded-xl text-sm font-bold border transition-all ${
                          form.containerSizeM3 === String(s)
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
                        }`}>
                        {s}³
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ══ CONTAINER NUMBER + RENTAL ══ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">Номер контейнера</Label>
                  <Input value={form.containerNumber} onChange={e => set('containerNumber', e.target.value)}
                    placeholder="Напр. КТ-001" className="h-9 rounded-xl text-sm font-mono" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">{dict.rental_duration} *</Label>
                  {!customRental ? (
                    <Select value={form.rentalDuration} onValueChange={v => {
                      if (v === '__custom__') { setCustomRental(true); set('rentalDuration', ''); }
                      else { set('rentalDuration', v); }
                    }}>
                      <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RENTAL_PRESETS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        <SelectItem value="__custom__">✏️ Другое...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-1.5">
                      <Input value={form.rentalDuration} onChange={e => set('rentalDuration', e.target.value)}
                        placeholder="напр. 3 дня" className="h-9 rounded-xl text-sm flex-1" required={!form.isExternalVehicle} autoFocus />
                      <button type="button" onClick={() => { setCustomRental(false); set('rentalDuration', '1 день'); }}
                        className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 bg-white text-lg flex-shrink-0">
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ══ AMOUNT + PAYMENT TYPE ══ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> {dict.amount} *
                  </Label>
                  <div className="relative">
                    <FormattedNumberInput placeholder="0" value={form.paymentAmount} onChange={onAmt}
                      className="h-9 rounded-xl text-sm font-bold pr-14" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">RUB</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">Тип оплаты *</Label>
                  <div className="grid grid-cols-2 gap-1.5 h-9">
                    {PAYMENT_TYPES.map(({ val, icon: Icon, label }) => (
                      <button key={val} type="button" onClick={() => set('paymentType', val)}
                        className={`h-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border transition-all ${
                          form.paymentType === val
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
                        }`}>
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ══ DRIVER ══ */}
              <div>
                <Label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-slate-500" />
                  {dict.driver} <span className="text-slate-300">({dict.optional || 'необязательно'})</span>
                </Label>
                <SearchableSelect
                  options={driverOptions}
                  value={form.driverId || 'none'}
                  onChange={v => set('driverId', v === 'none' ? '' : v)}
                  placeholder="Выбрать водителя..."
                />
              </div>
            </>
          )}

          {/* ══ STATUS (edit only) ══ */}
          {!form.isExternalVehicle && order && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">{dict.status}</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['new','assigned','in_progress','container_placed','picked_up','completed'].map(s => (
                      <SelectItem key={s} value={s}>{dict[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">{dict.payment_status}</Label>
                <Select value={form.paymentStatus} onValueChange={v => set('paymentStatus', v)}>
                  <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending','received','entered'].map(s => (
                      <SelectItem key={s} value={s}>{dict[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ══ NOTE ══ */}
          <div>
            <Label className="text-[11px] font-semibold text-slate-400 mb-1 block">{dict.operator_note}</Label>
            <Textarea value={form.operatorNote} onChange={e => set('operatorNote', e.target.value)}
              className="rounded-xl resize-none text-sm" rows={2} placeholder="Izoh / Заметка..." />
          </div>

          {/* ══ SUBMIT ══ */}
          <Button type="submit"
            className="w-full h-11 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
            disabled={loading}>
            {loading
              ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Сохраняется...</span>
              : order ? (dict.save || 'Сохранить') : (dict.create || '+ Создать заказ')}
          </Button>
        </form>
      </DialogContent>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white rounded-3xl border border-slate-200">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white/95 z-10 shrink-0">
            <DialogTitle className="text-lg font-bold">Выберите местоположение</DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative">
            <YMaps query={{ apikey: 'd6b97705-cb47-41ab-85a7-d8c7c93cb4a0', lang: 'ru_RU', load: 'package.full' }}>
              <YandexMap
                defaultState={{ center: [41.2995, 69.2401], zoom: 12, controls: [] }}
                width="100%"
                height="100%"
                modules={['geocode']}
                onLoad={(ymaps: any) => setYmapsInstance(ymaps)}
                onClick={(e: any) => {
                  const coords = e.get('coords');
                  setSelectedPoint(coords);
                  set('mapUrl', `https://yandex.ru/maps/?pt=${coords[1]},${coords[0]}&z=18`);
                  
                  const lat = coords[0];
                  const lon = coords[1];
                  
                  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`)
                    .then(res => res.json())
                    .then(data => {
                      if (data && data.display_name) {
                        // Extract a shorter address if possible (e.g., street and house number)
                        const addr = data.address;
                        let shortName = data.display_name;
                        if (addr) {
                          const parts = [];
                          if (addr.road) parts.push(addr.road);
                          if (addr.house_number) parts.push(addr.house_number);
                          if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
                          if (addr.city || addr.town) parts.push(addr.city || addr.town);
                          if (parts.length > 0) {
                            shortName = parts.join(', ');
                          }
                        }
                        set('address', shortName);
                      } else {
                        set('address', 'Локация по карте (URL)');
                      }
                    })
                    .catch((err) => {
                      console.error('Nominatim error:', err);
                      set('address', 'Локация по карте (URL)');
                    });
                }}
              >
                <SearchControl options={{ float: 'right' }} />
                <ZoomControl options={{ position: { top: 10, left: 10 } }} />
                {selectedPoint && <Placemark geometry={selectedPoint} options={{ preset: 'islands#blueDotIcon' }} />}
              </YandexMap>
            </YMaps>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMapOpen(false)} className="rounded-xl">
              Отмена
            </Button>
            <Button onClick={() => setMapOpen(false)} className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              Подтвердить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
