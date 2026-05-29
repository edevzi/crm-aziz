'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { createDriver, updateDriver } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';

export function DriverForm({ dict, driver }: { dict: any, driver?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(driver ? {
    name: driver.name || '',
    phone: driver.phone || '',
    vehiclePlate: driver.vehiclePlate || '',
    username: driver.username || '',
    password: driver.password || '',
    wagePerOrder: driver.wagePerOrder?.toString() || '',
  } : {
    name: '',
    phone: '',
    vehiclePlate: '',
    username: '',
    password: '',
    wagePerOrder: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (driver) {
        await updateDriver(driver.id, formData);
      } else {
        await createDriver(formData);
      }
      setOpen(false);
      if (!driver) setFormData({ name: '', phone: '', vehiclePlate: '', username: '', password: '', wagePerOrder: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {driver ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> {dict.add_driver}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driver ? dict.add_driver.replace('+', '✎') : dict.add_driver}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{dict.name}</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{dict.phone}</Label>
            <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehiclePlate">{dict.vehicle_plate}</Label>
            <Input id="vehiclePlate" value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wagePerOrder">{"Ставка за заказ (RUB)"}</Label>
            <FormattedNumberInput 
              id="wagePerOrder" 
              value={formData.wagePerOrder} 
              onChange={val => setFormData({...formData, wagePerOrder: val})} 
              required 
              placeholder="0" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{dict.username} ({dict.optional || "Optional"})</Label>
            <Input id="username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{dict.password} ({dict.optional || "Optional"})</Label>
            <Input id="password" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : driver ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
