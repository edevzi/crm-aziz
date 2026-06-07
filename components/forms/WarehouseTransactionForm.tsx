'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addWarehouseTransaction } from '@/app/actions/entities';
import { Plus, ArrowUpFromLine, Truck, FileText } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export function WarehouseTransactionForm({ dict, drivers = [] }: { dict: any, drivers?: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Warehouse only tracks outbound (Расход) — inbound accrues automatically from
  // completed orders, so manual inbound entry was removed per request.
  const type = 'outbound' as const;
  const [containerSizeM3, setContainerSizeM3] = useState('');
  const [containerCount, setContainerCount] = useState('1');
  const [note, setNote] = useState('');
  const [driverId, setDriverId] = useState('');
  const [driverAmount, setDriverAmount] = useState('');
  const [svalkaAmount, setSvalkaAmount] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setContainerSizeM3('');
    setContainerCount('1');
    setNote('');
    setDriverId('');
    setDriverAmount('');
    setSvalkaAmount('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const size = parseInt(containerSizeM3) || 0;
      const count = parseInt(containerCount) || 1;
      const totalVolume = size * count;

      if (totalVolume <= 0) {
        setError('Выберите размер контейнера');
        return;
      }

      const parsedDriverAmount = driverAmount ? parseInt(driverAmount.replace(/\D/g, '')) : undefined;
      const parsedSvalkaAmount = svalkaAmount ? parseInt(svalkaAmount.replace(/\D/g, '')) : undefined;
      const parsedDriverId = driverId ? parseInt(driverId) : undefined;

      await addWarehouseTransaction({
        type,
        volumeM3: totalVolume,
        containerSizeM3: size,
        containerCount: count,
        note: note || undefined,
        driverId: parsedDriverId,
        driverAmount: parsedDriverAmount && parsedDriverAmount > 0 ? parsedDriverAmount : undefined,
        svalkaAmount: parsedSvalkaAmount && parsedSvalkaAmount > 0 ? parsedSvalkaAmount : undefined,
      });
      setOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Ошибка при создании записи');
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = (parseInt(containerSizeM3) || 0) * (parseInt(containerCount) || 1);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Журнал отходов
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Журнал отходов</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Outbound-only banner */}
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-rose-500 text-white shadow-md shadow-rose-500/30">
            <ArrowUpFromLine className="h-4 w-4" />
            Расход
          </div>

          {/* Container size + count */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Контейнер</Label>
            <div className="grid grid-cols-4 gap-2">
              {[8, 20, 27, 30].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setContainerSizeM3(String(opt))}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    containerSizeM3 === String(opt)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {opt} м³
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Label className="text-sm text-slate-500 whitespace-nowrap">Кол-во:</Label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setContainerCount(String(Math.max(1, (parseInt(containerCount) || 1) - 1)))} className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center">−</button>
                <Input
                  type="number"
                  min="1"
                  value={containerCount}
                  onChange={e => setContainerCount(e.target.value)}
                  className="w-16 text-center font-bold"
                />
                <button type="button" onClick={() => setContainerCount(String((parseInt(containerCount) || 1) + 1))} className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center">+</button>
              </div>
              {totalVolume > 0 && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full ml-auto">
                  = {totalVolume} м³
                </span>
              )}
            </div>
          </div>

          {/* Driver + payments (outbound only) */}
          {type === 'outbound' && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Водитель и оплата
              </Label>
              <SearchableSelect
                options={drivers.map(d => ({ value: String(d.id), label: d.name }))}
                value={driverId}
                onChange={setDriverId}
                placeholder="Выберите водителя..."
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Водителю</Label>
                  <div className="relative">
                    <FormattedNumberInput
                      id="driverAmount"
                      placeholder="0"
                      value={driverAmount}
                      onChange={setDriverAmount}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₽</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Свалке</Label>
                  <div className="relative">
                    <FormattedNumberInput
                      id="svalkaAmount"
                      placeholder="0"
                      value={svalkaAmount}
                      onChange={setSvalkaAmount}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₽</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Заметка
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Дополнительная информация..."
              className="resize-none"
              rows={2}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !containerSizeM3}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              type === 'outbound'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
            }`}
          >
            {loading ? 'Сохранение...' : type === 'outbound' ? 'Записать расход' : 'Записать приход'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
