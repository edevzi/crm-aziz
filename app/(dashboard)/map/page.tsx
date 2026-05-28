import React from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { DriverMap } from '@/components/DriverMap';
import { MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const lang: string = 'ru';
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {dict.live_tracking || 'Onlayn xarita'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {'Отслеживание перемещения водителей в реальном времени.'}
          </p>
        </div>
      </div>

      <DriverMap lang={lang || 'ru'} dict={dict} />
    </div>
  );
}
