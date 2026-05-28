'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from '@/app/actions/order';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CompleteOrderButton({ orderId }: { orderId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    startTransition(() => {
      updateOrderStatus(orderId, 'completed').then(() => {
        toast.success('Заказ успешно завершен!');
      }).catch(() => {
        toast.error('Ошибка при завершении заказа');
      });
    });
  };

  return (
    <Button 
      size="sm" 
      onClick={handleComplete} 
      disabled={isPending}
      className="mt-1.5 h-7 px-2.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition-all"
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3 h-3 mr-1.5" />}
      Завершить заказ
    </Button>
  );
}
