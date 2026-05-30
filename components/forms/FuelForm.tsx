'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createFuelLog, updateFuelLog } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';


export function FuelForm({ dict, log, drivers }: { dict: any, log?: any, drivers: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const initialData = log ? {
    driverId: String(log.driverId || ''),
    stationName: log.stationName || '',
    liters: String(log.liters || ''),
    priceRub: String(log.priceRub || ''),
    vehicle: log.vehicle || ''
  } : {
    driverId: '',
    stationName: '',
    liters: '',
    priceRub: '',
    vehicle: ''
  };

  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) {
        await updateFuelLog(log.id, formData);
      } else {
        await createFuelLog(formData);
      }
      setOpen(false);
      if (!log) {
        setFormData({ driverId: '', stationName: '', liters: '', priceRub: '', vehicle: '' });
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
            <Plus className="h-4 w-4 mr-2" /> {dict.log_fuel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{log ? dict.log_fuel.replace('+', '✎') : dict.log_fuel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">{dict.driver}</Label>
            <Select value={formData.driverId.toString()} onValueChange={val => {
              const driver = drivers.find(d => d.id.toString() === val);
              setFormData({
                ...formData,
                driverId: val,
                vehicle: driver ? driver.vehiclePlate : formData.vehicle
              });
            }} required>
              <SelectTrigger>
                <SelectValue placeholder={dict.select_driver || "Select driver"} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle">{dict.vehicle}</Label>
            <Input id="vehicle" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stationName">{dict.station}</Label>
            <Input id="stationName" value={formData.stationName} onChange={e => setFormData({...formData, stationName: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liters">{dict.liters}</Label>
              <FormattedNumberInput id="liters" value={formData.liters} onChange={(val: string) => setFormData({...formData, liters: val})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceRub">{dict.cost} (RUB)</Label>
              <FormattedNumberInput 
                id="priceRub" 
                value={formData.priceRub} 
                onChange={(val: string) => setFormData({ ...formData, priceRub: val })} 
                required 
                placeholder="0"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : log ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
