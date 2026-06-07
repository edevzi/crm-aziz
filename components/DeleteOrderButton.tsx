'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteOrder } from '@/app/actions/order';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function DeleteOrderButton({
  orderId,
  variant = 'icon',
  redirectTo,
}: {
  orderId: number;
  /** 'icon' = compact trash icon (table rows); 'full' = labelled button (detail page) */
  variant?: 'icon' | 'full';
  /** Where to navigate after a successful delete. Defaults to a soft refresh. */
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteOrder(orderId);
      if (res?.success) {
        toast.success('Заказ удалён');
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        toast.error(res?.error || 'Ошибка при удалении заказа');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'full' ? (
          <Button
            variant="outline"
            className="rounded-xl gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" /> Удалить
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
            aria-label="Удалить заказ"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md sm:rounded-3xl">
        <DialogHeader>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <DialogTitle className="font-extrabold">Удалить заказ #{orderId}?</DialogTitle>
          <DialogDescription className="text-slate-500">
            Это действие необратимо. Заказ и связанные с ним записи (расходы, складские
            операции, история событий) будут удалены без возможности восстановления.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl gap-2"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
