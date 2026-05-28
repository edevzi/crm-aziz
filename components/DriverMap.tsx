"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const DriverMapInner = dynamic(
  () => import('./DriverMapInner'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-3xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Xarita yuklanmoqda / Карта загружается...</p>
        </div>
      </div>
    )
  }
);

export function DriverMap({ lang, dict }: { lang: string; dict: any }) {
  return <DriverMapInner lang={lang} dict={dict} />;
}
