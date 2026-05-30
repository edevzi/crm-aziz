'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateOrderPayment } from '@/app/actions/order';
import { CheckCircle2 } from 'lucide-react';

export function ConfirmPaymentButton({ orderId, currentStatus }: { orderId: number, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  if (currentStatus === 'entered') return null;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      await updateOrderPayment(orderId, 'entered');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleConfirm} 
      disabled={loading}
      className="h-6 px-2.5 gap-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 hover:border-emerald-500 shadow-sm transition-all duration-200 group"
      title="Внести в кассу"
    >
      <CheckCircle2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{loading ? '...' : 'Внести в кассу'}</span>
    </Button>
  );
}
