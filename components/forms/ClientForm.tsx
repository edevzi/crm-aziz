'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient, updateClient } from '@/app/actions/entities';
import { Plus, Edit2, MapPin } from 'lucide-react';

export function ClientForm({ dict, client }: { dict: any, client?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(client || {
    name: '',
    phone: '',
    address: '',
    mapUrl: ''
  });

  const set = (key: string, val: string) => setFormData((p: any) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (client) {
        await updateClient(client.id, formData);
      } else {
        await createClient(formData);
      }
      setOpen(false);
      if (!client) setFormData({ name: '', phone: '', address: '', mapUrl: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {client ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> {dict.add_client}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? dict.add_client.replace('+', '✎') : dict.add_client}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{dict.name}</Label>
            <Input id="name" value={formData.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{dict.phone}</Label>
            <Input id="phone" value={formData.phone} onChange={e => set('phone', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{dict.address}</Label>
            <Input id="address" value={formData.address} onChange={e => set('address', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapUrl" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              Ссылка на карту (Google / Yandex)
            </Label>
            <Input
              id="mapUrl"
              value={formData.mapUrl}
              onChange={e => set('mapUrl', e.target.value)}
              placeholder="https://maps.google.com/... или https://yandex.ru/maps/..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : client ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

