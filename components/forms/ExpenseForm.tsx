'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createExpense, updateExpense, getRecentOrders } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';

const EXPENSE_CATEGORIES = ['fuel', 'diesel', 'spare_parts', 'repair', 'utilization', 'base_rent', 'gai', 'driver_salary', 'worker_salary', 'dispatcher_salary', 'referral_fee', 'master_fee', 'other', 'tractor'];

export function ExpenseForm({ dict, expense, drivers = [], dispatchers = [] }: { dict: any, expense?: any, drivers?: any[], dispatchers?: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(expense ? {
    category: expense.category || '',
    amountRub: String(expense.amountRub || ''),
    note: expense.note || '',
    orderId: expense.orderId || '',
    driverId: expense.driverId || '',
    dispatcherId: expense.dispatcherId || '',
    liters: expense.liters || ''
  } : {
    category: '',
    amountRub: '',
    note: '',
    orderId: '',
    driverId: '',
    dispatcherId: '',
    liters: ''
  });

  const [ordersList, setOrdersList] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      getRecentOrders().then(data => {
        setOrdersList(data);
      });
    }
  }, [open]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expense) {
        await updateExpense(expense.id, formData);
      } else {
        await createExpense(formData);
      }
      setOpen(false);
      if (!expense) {
        setFormData({ category: '', amountRub: '', note: '', orderId: '', driverId: '', dispatcherId: '', liters: '' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expense ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> {dict.add_expense}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? dict.edit_expense : dict.add_expense}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{dict.category}</Label>
            <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})} required>
              <SelectTrigger>
                <SelectValue placeholder={dict.select_category} />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{dict[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.category === 'dispatcher_salary' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dispatcherId">Диспетчер</Label>
                <Select 
                  value={formData.dispatcherId ? String(formData.dispatcherId) : "unassigned"} 
                  onValueChange={val => setFormData({...formData, dispatcherId: val === "unassigned" ? "" : val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите диспетчера" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">-- Не выбрано (Общий расход) --</SelectItem>
                    {dispatchers.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderId">Заказ</Label>
                <Select 
                  value={formData.orderId ? String(formData.orderId) : "unassigned"} 
                  onValueChange={val => setFormData({...formData, orderId: val === "unassigned" ? "" : val})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите заказ" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] overflow-y-auto">
                    <SelectItem value="unassigned">-- Не выбран (Общий расход) --</SelectItem>
                    {ordersList.map(o => {
                      const clientInfo = o.isExternalVehicle 
                        ? `Стороннее авто (${o.externalDriverName || 'Без имени'})` 
                        : (o.clientName || 'Без клиента');
                      return (
                        <SelectItem key={o.id} value={String(o.id)}>
                          #{o.id} — {clientInfo} — {o.address} ({o.paymentAmount?.toLocaleString()} RUB)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {(formData.category === 'fuel' || formData.category === 'diesel' || formData.category === 'gai' || formData.category === 'driver_salary' || formData.category === 'spare_parts' || formData.category === 'master_fee' || formData.category === 'utilization') && (
            <div className="space-y-2">
              <Label htmlFor="driverId">Водитель</Label>
              <Select 
                value={formData.driverId ? String(formData.driverId) : "unassigned"} 
                onValueChange={val => setFormData({...formData, driverId: val === "unassigned" ? "" : val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите водителя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Не выбрано (Общий расход) --</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(formData.category === 'fuel' || formData.category === 'diesel' || formData.category === 'utilization') && (
            <div className="space-y-2">
              <Label htmlFor="liters">{formData.category === 'utilization' ? 'Объем (м³)' : 'Литры'}</Label>
              <FormattedNumberInput 
                id="liters" 
                value={formData.liters || ''} 
                onChange={(val: string) => setFormData({...formData, liters: val})} 
                placeholder="Например: 40"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="amountRub">{dict.amount} (RUB)</Label>
            <FormattedNumberInput 
              id="amountRub" 
              value={formData.amountRub} 
              onChange={(val: string) => setFormData({ ...formData, amountRub: val })} 
              required 
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">{dict.note}</Label>
            <Textarea id="note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : expense ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
