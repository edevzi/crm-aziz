'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function getPhotoSrc(photoUrl: string): string {
  if (photoUrl.startsWith('http')) return photoUrl;
  if (photoUrl.startsWith('data:image')) return photoUrl;
  return `data:image/jpeg;base64,${photoUrl}`;
}

interface OrderPhotoViewerProps {
  photoUrl: string;
  /** "thumbnail" = small 40x40 in table rows, "preview" = larger inline image on detail page */
  variant?: 'thumbnail' | 'preview';
}

export function OrderPhotoViewer({ photoUrl, variant = 'thumbnail' }: OrderPhotoViewerProps) {
  if (!photoUrl) return null;

  const src = getPhotoSrc(photoUrl);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'thumbnail' ? (
          <button
            type="button"
            className="mt-1 block rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt="Фото заказа"
              className="w-10 h-10 object-cover"
              loading="lazy"
            />
          </button>
        ) : (
          <button
            type="button"
            className="block rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt="Фото заказа"
              className="w-full max-w-xs h-auto max-h-56 object-cover"
              loading="lazy"
            />
          </button>
        )}
      </DialogTrigger>
      <DialogContent
        className="!max-w-[95vw] !max-h-[95vh] sm:!max-w-[90vw] !p-0 !border-0 !rounded-2xl !bg-black/95 !shadow-2xl [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:top-4 [&>button]:right-4 [&>button]:z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="absolute top-0 left-0 right-12 z-40 p-4">
          <DialogTitle className="text-white/80 text-sm font-medium truncate">
            Фото с места выполнения заказа
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center w-full h-full min-h-[50vh] p-4 pt-12">
          <img
            src={src}
            alt="Фото заказа"
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
