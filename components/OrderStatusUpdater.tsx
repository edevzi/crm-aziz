'use client';

import React, { useTransition } from 'react';
import { updateOrderStatus } from '@/app/actions/order';
import { Check, Clock, Truck, MapPin, ArchiveRestore, CheckCircle2 } from 'lucide-react';

export function OrderStatusUpdater({ orderId, currentStatus, dict }: { orderId: number, currentStatus: string, dict: any }) {
  const [isPending, startTransition] = useTransition();

  const steps = [
    { id: 'new', icon: Clock },
    { id: 'assigned', icon: Check },
    { id: 'in_progress', icon: Truck },
    { id: 'container_placed', icon: MapPin },
    { id: 'picked_up', icon: ArchiveRestore },
    { id: 'completed', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStatus);

  const handleUpdate = (statusId: string) => {
    startTransition(() => {
      updateOrderStatus(orderId, statusId);
    });
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
              <button
                onClick={() => handleUpdate(step.id)}
                disabled={isPending}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2 ${
                  isCompleted 
                    ? 'bg-primary border-primary text-white hover:scale-110 shadow-primary/30' 
                    : isCurrent 
                      ? 'bg-white border-primary text-primary scale-110 shadow-primary/20 shadow-lg ring-4 ring-primary/10' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
                }`}
              >
                <step.icon className={`w-5 h-5 ${isCurrent && !isCompleted ? 'animate-pulse' : ''}`} />
              </button>
              <div className={`text-xs font-bold text-center max-w-[80px] leading-tight transition-colors ${
                isCurrent ? 'text-primary' : isCompleted ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {dict[step.id] || step.id.replace('_', ' ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
