import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-6">
      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.2s linear infinite;
        }
      `}</style>
      
      <div className="relative w-16 h-16">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        {/* Inner reverse-spinning glowing ring */}
        <div className="absolute inset-2 rounded-full border-4 border-indigo-500/15 border-t-indigo-500 animate-spin-reverse" />
      </div>
      
      <div className="flex flex-col items-center space-y-2.5">
        <span className="text-sm font-black text-slate-700 tracking-wider uppercase animate-pulse">
          Yuklanmoqda... / Загрузка...
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Iltimos, kuting / Пожалуйста, подождите
        </span>
      </div>
    </div>
  );
}
