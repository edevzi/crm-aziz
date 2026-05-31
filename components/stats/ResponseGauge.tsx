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
 * Single-purpose dial: how fast did this team/driver accept orders on average?
 * Greener and fuller = faster. Single bar, single number, single quality label.
 */
export function ResponseGauge({ seconds, size = 120 }: { seconds: number | null; size?: number }) {
  const q = stageQuality('approve', seconds);
  const color = COLOR[q];
  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = seconds == null ? 0 : Math.max(0.05, Math.min(1, 1 - seconds / (60 * 60)));
  const offset = C * (1 - frac);

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
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl font-extrabold leading-none" style={{ color }}>
          {formatDuration(seconds)}
        </span>
        {QUALITY_LABEL[q] && (
          <span className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color }}>
            {QUALITY_LABEL[q]}
          </span>
        )}
      </div>
    </div>
  );
}
