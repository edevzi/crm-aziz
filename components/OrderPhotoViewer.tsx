'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrderPhotoViewer({ photoUrl }: { photoUrl: string }) {
  if (!photoUrl) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-1.5 h-7 px-2.5 text-[10px] uppercase font-bold tracking-wider text-slate-600 hover:text-slate-900 border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <ImageIcon className="w-3 h-3 mr-1.5" />
          Фото
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:!max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Фото с места выполнения заказа</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center mt-2 sm:mt-4">
          <img
            src={
              photoUrl.startsWith('http') ? photoUrl :
              photoUrl.startsWith('data:image') ? photoUrl :
              `data:image/jpeg;base64,${photoUrl}`
            }
            alt="Фото заказа"
            className="max-w-full max-h-[70vh] rounded-md object-contain shadow-sm border border-slate-200"
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
