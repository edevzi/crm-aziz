'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addWarehouseTransaction } from '@/app/actions/entities';
import { Plus, ArrowDown, ArrowUp } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export function WarehouseTransactionForm({ dict, drivers = [] }: { dict: any, drivers?: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'inbound' | 'outbound'>('outbound');
  const [containerSizeM3, setContainerSizeM3] = useState('');
  const [containerCount, setContainerCount] = useState('1');
  const [note, setNote] = useState('');
  const [driverId, setDriverId] = useState('');
  const [driverAmount, setDriverAmount] = useState('');
  const [svalkaAmount, setSvalkaAmount] = useState('');

  const OUTBOUND_OPTIONS = [20, 27, 30];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const size = parseInt(containerSizeM3) || 0;
      const count = parseInt(containerCount) || 1;
      const totalVolume = size * count;

      await addWarehouseTransaction({
        type,
        volumeM3: totalVolume,
        containerSizeM3: size,
        containerCount: count,
        note,
        driverId: driverId ? parseInt(driverId) : undefined,
        driverAmount: driverAmount ? parseInt(driverAmount) : undefined,
        svalkaAmount: svalkaAmount ? parseInt(svalkaAmount) : undefined,
      });
      setOpen(false);
      // reset
      setContainerSizeM3('');
      setContainerCount('1');
      setNote('');
      setDriverId('');
      setDriverAmount('');
      setSvalkaAmount('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> {dict.log_waste || 'Журнал отходов'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.log_waste || 'Добавить новую запись'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label>Тип транзакции</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(val: any) => setType(val)} 
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inbound" id="inbound" />
                <Label htmlFor="inbound" className="cursor-pointer">Приход (Входящие)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outbound" id="outbound" />
                <Label htmlFor="outbound" className="cursor-pointer">Расход (Исходящие)</Label>
              </div>
            </RadioGroup>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Размер (m³)</Label>
              <div className="flex flex-wrap gap-2">
                {[8, 20, 27, 30].map(opt => (
                  <Button
                    key={opt}
                    type="button"
                    variant={containerSizeM3 === String(opt) ? "default" : "outline"}
                    onClick={() => setContainerSizeM3(String(opt))}
                    className="flex-1 min-w-[60px]"
                  >
                    {opt} m³
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="containerCount">Количество (шт)</Label>
              <Input
                id="containerCount"
                type="number"
                min="1"
                value={containerCount}
                onChange={e => setContainerCount(e.target.value)}
                placeholder="Напр. 1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Водитель</Label>
            <SearchableSelect
              options={drivers.map(d => ({ value: String(d.id), label: d.name }))}
              value={driverId}
              onChange={setDriverId}
              placeholder="Выберите водителя..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverAmount">Оплата водителю</Label>
              <FormattedNumberInput
                id="driverAmount"
                placeholder="Сумма"
                value={driverAmount}
                onChange={setDriverAmount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svalkaAmount">Оплата свалке</Label>
              <FormattedNumberInput
                id="svalkaAmount"
                placeholder="Сумма"
                value={svalkaAmount}
                onChange={setSvalkaAmount}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{dict.note || 'Заметка'}</Label>
            <Textarea 
              id="note" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Дополнительная информация..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !containerSizeM3}>
            {loading ? '...' : (dict.create || 'Сохранить')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
