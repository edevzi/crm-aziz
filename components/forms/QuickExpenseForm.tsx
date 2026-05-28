'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createExpense } from '@/app/actions/entities';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';


export function QuickExpenseForm({ dict, category }: { dict: any, category: string }) {
  const [loading, setLoading] = useState(false);
  const [amountRub, setAmountRub] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExpense({
        category,
        amountRub,
        note
      });
      setAmountRub('');
      setNote('');
      toast.success(dict.save);
    } catch (err: any) {
      toast.error(err.message || (dict.error || 'Xatolik'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100 mt-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-500 uppercase">{dict.amount} (RUB)</Label>
        <FormattedNumberInput 
          value={amountRub} 
          onChange={setAmountRub} 
          required 
          placeholder="0"
          className="font-bold text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-500 uppercase">{dict.note}</Label>
        <Textarea 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          placeholder="Кому, за что..."
          className="resize-none h-16 text-sm"
        />
      </div>
      <Button type="submit" className="w-full shadow-lg transition-transform hover:scale-[1.02]" disabled={loading}>
        {loading ? '...' : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            {dict.add_expense}
          </>
        )}
      </Button>
    </form>
  );
}
