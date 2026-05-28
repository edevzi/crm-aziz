'use client';

import React, { useTransition } from 'react';
import { updateOrderPayment } from '@/app/actions/order';
import { Button } from '@/components/ui/button';

export function PaymentStatusUpdater({ orderId, currentStatus, dict }: { orderId: number, currentStatus: string, dict: any }) {
  const [isPending, startTransition] = useTransition();

  const statuses = ['pending', 'received', 'entered'];

  return (
    <div className="flex gap-2 mt-4">
      {statuses.map(status => (
        <Button
          key={status}
          variant={currentStatus === status ? "default" : "outline"}
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => updateOrderPayment(orderId, status))}
          className={`rounded-full ${currentStatus === status ? 'shadow-md' : ''}`}
        >
          {dict[status] || status}
        </Button>
      ))}
    </div>
  );
}
