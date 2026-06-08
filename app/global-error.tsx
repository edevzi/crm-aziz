'use client';

import { useEffect } from 'react';

/**
 * Root error boundary. Catches client-side exceptions that would otherwise
 * white-screen the whole app (the "Application error: a client-side exception
 * has occurred" page). Must render its own <html>/<body> because it replaces
 * the root layout when a render error escapes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real error in the console / monitoring.
    console.error('GlobalError:', error);
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'global',
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
    // Stale JS chunks after a deploy (common on cached mobile pages) → ChunkLoadError.
    // Recover automatically with one hard reload to fetch the fresh build.
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
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f5f9',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: 380,
            width: '100%',
            background: '#fff',
            borderRadius: 24,
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: '#fff1f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Что-то пошло не так
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
            Произошла ошибка при загрузке страницы. Попробуйте обновить — обычно это
            помогает.
          </p>
          <button
            onClick={() => { if (typeof window !== 'undefined') window.location.reload(); else reset(); }}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 14,
              border: 'none',
              background: '#4f46e5',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Обновить страницу
          </button>
        </div>
      </body>
    </html>
  );
}
