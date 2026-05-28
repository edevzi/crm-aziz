'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { createSafeTransaction } from '@/app/actions/entities';

const formatNum = (val: string | number) => {
  if (!val) return '0';
  return new Intl.NumberFormat('ru-RU').format(Number(val));
};

export function CloseShiftForm({ dict }: { dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States
  const [netProfit, setNetProfit] = useState('');
  const [toSafe, setToSafe] = useState('');
  const [withdrawal, setWithdrawal] = useState('');

  const router = useRouter();

  // Auto calculate withdrawal based on net profit and to safe
  const handleNetProfitChange = (val: string) => {
    setNetProfit(val);
    if (toSafe && val) {
      setWithdrawal((Number(val) - Number(toSafe)).toString());
    }
  };

  const handleToSafeChange = (val: string) => {
    setToSafe(val);
    if (netProfit && val) {
      setWithdrawal((Number(netProfit) - Number(val)).toString());
    }
  };

  const handleWithdrawalChange = (val: string) => {
    setWithdrawal(val);
    if (netProfit && val) {
      setToSafe((Number(netProfit) - Number(val)).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profit = Number(netProfit);
    const safeAmt = Number(toSafe);
    const withAmt = Number(withdrawal);

    if (profit <= 0 || safeAmt < 0 || withAmt < 0) {
      toast.error('Введите корректные суммы');
      return;
    }

    if (safeAmt + withAmt !== profit) {
      toast.error('Сумма "В сейф" и "Прибыль" должна быть равна общей прибыли');
      return;
    }

    setLoading(true);
    try {
      // 1. Add Net Profit to Safe
      await createSafeTransaction({
        type: 'income',
        amountRub: profit,
        note: 'Закрытие смены: Общая прибыль',
      });

      // 2. Withdraw the profit part
      if (withAmt > 0) {
        await createSafeTransaction({
          type: 'expense',
          amountRub: withAmt,
          note: 'Вывод прибыли (Дивиденды) при закрытии смены',
        });
      }

      toast.success('Смена успешно закрыта');
      setOpen(false);
      
      // Reset
      setNetProfit('');
      setToSafe('');
      setWithdrawal('');
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при закрытии смены');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-500/20">
          <Lock className="mr-2 h-4 w-4" />
          Закрыть смену
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Закрытие смены</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Чистая прибыль за смену (RUB)</Label>
            <FormattedNumberInput 
              required 
              value={netProfit} 
              onChange={handleNetProfitChange} 
              placeholder="100 000"
              className="text-lg font-bold"
            />
            <p className="text-xs text-muted-foreground">Общая чистая прибыль после всех расходов.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label className="text-emerald-600 font-semibold">В сейф (RUB)</Label>
              <FormattedNumberInput 
                required 
                value={toSafe} 
                onChange={handleToSafeChange} 
                placeholder="60 000"
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-indigo-600 font-semibold">Забрать (Дивиденды)</Label>
              <FormattedNumberInput 
                required 
                value={withdrawal} 
                onChange={handleWithdrawalChange} 
                placeholder="40 000"
                className="border-indigo-200 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-md text-sm">
            <p><strong>Итог:</strong></p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
              <li>Сейф пополнится на: <strong>{formatNum(toSafe)} RUB</strong></li>
              <li>Изъято наличными: <strong>{formatNum(withdrawal)} RUB</strong></li>
            </ul>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Подтвердить закрытие
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
