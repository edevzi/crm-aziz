'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createDispatcher, updateDispatcher } from '@/app/actions/entities';
import { Plus, Edit2, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DispatcherForm({ dict, dispatcher }: { dict: any, dispatcher?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState(dispatcher || {
    name: '',
    phone: '',
  });

  const set = (key: string, val: string) => setFormData((p: any) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (dispatcher) {
        await updateDispatcher(dispatcher.id, formData);
      } else {
        await createDispatcher(formData);
      }
      setOpen(false);
      router.refresh();
      if (!dispatcher) setFormData({ name: '', phone: '' });
    } finally {
      setLoading(false);
    }
  };

  const addLabel = dict['+ Новый диспетчер'] || '+ Новый диспетчер';
  const editLabel = dict['Редактировать диспетчера'] || 'Редактировать диспетчера';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div onClick={(e) => e.stopPropagation()}>
          {dispatcher ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
              <Edit2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
              <Plus className="h-4 w-4 mr-2" /> {addLabel}
            </Button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dispatcher ? editLabel : addLabel}</DialogTitle>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : dispatcher ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
