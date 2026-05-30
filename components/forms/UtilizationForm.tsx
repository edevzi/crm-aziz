'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUtilizationLog, updateUtilizationLog } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


export function UtilizationForm({ dict, log, drivers }: { dict: any, log?: any, drivers: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const initialData = log ? {
    driverId: String(log.driverId || ''),
    vehiclePlate: log.vehiclePlate || '',
    m3: String(log.m3 || ''),
    amountRub: String(log.amountRub || ''),
    note: log.note || ''
  } : {
    driverId: '',
    vehiclePlate: '',
    m3: '',
    amountRub: '',
    note: ''
  };

  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) {
        await updateUtilizationLog(log.id, formData);
      } else {
        await createUtilizationLog(formData);
      }
      setOpen(false);
      if (!log) {
        setFormData({ driverId: '', vehiclePlate: '', m3: '', amountRub: '', note: '' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {log ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> Добавить на свалку
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{log ? "Редактировать запись свалки" : "Добавить запись на свалку"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">{dict.driver}</Label>
            <Select value={formData.driverId.toString()} onValueChange={val => {
              const driver = drivers.find(d => d.id.toString() === val);
              setFormData({
                ...formData,
                driverId: val,
                vehiclePlate: driver ? driver.vehiclePlate : formData.vehiclePlate
              });
            }} required>
              <SelectTrigger>
                <SelectValue placeholder={dict.select_driver || "Выберите водителя"} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehiclePlate">Номер авто</Label>
            <Input id="vehiclePlate" value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="m3">Объем (м³)</Label>
              <FormattedNumberInput id="m3" value={formData.m3} onChange={(val: string) => setFormData({...formData, m3: val})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountRub">{dict.cost} (RUB)</Label>
              <FormattedNumberInput 
                id="amountRub" 
                value={formData.amountRub} 
                onChange={(val: string) => setFormData({ ...formData, amountRub: val })} 
                required 
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Примечание</Label>
            <Textarea id="note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : log ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
