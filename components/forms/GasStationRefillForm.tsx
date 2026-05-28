'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { addGasStationInbound } from '@/app/actions/entities';
import { Plus, Fuel } from 'lucide-react';
import { format } from 'date-fns';

export function GasStationRefillForm({ dict }: { dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    liters: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addGasStationInbound({
        liters: parseInt(formData.liters) || 0,
        note: formData.note,
        recordedAt: new Date(formData.date)
      });
      setOpen(false);
      setFormData({ liters: '', note: '', date: format(new Date(), 'yyyy-MM-dd') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl px-4 py-2 font-semibold shadow-sm transition-all" variant="outline">
          <Fuel className="h-4 w-4 mr-2 text-indigo-500" />
          {dict.refill_station || 'Пополнить заправку'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.refill_station || 'Пополнение собственной заправки'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="liters">{dict.liters || 'Литры'}</Label>
            <FormattedNumberInput 
              id="liters" 
              value={formData.liters} 
              onChange={(val: string) => setFormData({...formData, liters: val})} 
              required 
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">{dict.note || 'Примечание (необязательно)'}</Label>
            <Input 
              id="note" 
              type="text" 
              value={formData.note} 
              onChange={e => setFormData({...formData, note: e.target.value})} 
              placeholder="Например, от поставщика..."
            />
          </div>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? '...' : (dict.save || 'Сохранить')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
