'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Dashboard-segment error boundary. Recovers gracefully from a render/runtime
 * exception in any dashboard page without white-screening the app, keeping the
 * sidebar/layout intact and offering a retry.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('DashboardError:', error);
    // Report the real error to the server so it is visible in Vercel logs
    // (a phone-side crash is otherwise invisible). Fire-and-forget.
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'dashboard',
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
          digest: error?.digest,
          url: typeof location !== 'undefined' ? location.href : '',
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
    // After a new deployment, a page cached on the device (very common on mobile)
    // can request stale JS chunks that no longer exist on the server → ChunkLoadError.
    // Recover automatically with a single hard reload to fetch the fresh build.
    const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
    const isChunkError = /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i.test(text);
    if (isChunkError && typeof window !== 'undefined') {
      const KEY = 'vg:chunk-reload';
      const last = Number(sessionStorage.getItem(KEY) || '0');
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 text-center">
        <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-rose-600" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-1.5">Не удалось загрузить</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          При отображении этой страницы произошла ошибка. Попробуйте ещё раз.
        </p>
        <Button onClick={() => { if (typeof window !== 'undefined') window.location.reload(); else reset(); }} className="w-full rounded-2xl gap-2 font-bold">
          <RotateCcw className="h-4 w-4" /> Повторить
        </Button>
      </div>
    </div>
  );
}
