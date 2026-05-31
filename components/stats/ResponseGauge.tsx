import React from 'react';
import { formatDuration } from '@/lib/driver-stats-compute';
import { stageQuality, QUALITY_LABEL, type Quality } from '@/lib/driver-stats-meta';

const COLOR: Record<Quality, string> = {
  good: '#10b981',
  ok: '#f59e0b',
  slow: '#f43f5e',
  neutral: '#94a3b8',
};

/**
 * Speedometer-style ring for "time to accept". Fuller and greener = faster.
 * Subtle one-time fill on mount, no other motion. Value rendered as plain text.
 */
export function ResponseGauge({ seconds, size = 132 }: { seconds: number | null; size?: number }) {
  const q = stageQuality('approve', seconds);
  const color = COLOR[q];
  const R = 52;
  const C = 2 * Math.PI * R;
  // map 0..60 minutes → 1..0.06 (fuller for faster reactions)
  const frac = seconds == null ? 0 : Math.max(0.06, Math.min(1, 1 - seconds / (60 * 60)));
  const target = C * (1 - frac);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          className="ds-gauge"
          style={{ ['--circ' as any]: `${C}`, ['--target' as any]: `${target}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl font-extrabold leading-none" style={{ color }}>
          {formatDuration(seconds)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color }}>
          {QUALITY_LABEL[q] || '—'}
        </span>
      </div>
    </div>
  );
}
