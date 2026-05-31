// Bright, vivid palette for the statistics charts.
import type { StageKey } from '@/lib/driver-stats-meta';

export const STEP_COLOR: Record<StageKey, string> = {
  approve: '#8b5cf6', // violet
  start: '#3b82f6', // blue
  place: '#06b6d4', // cyan
  pickup: '#f59e0b', // amber (rental)
  complete: '#22c55e', // green
};

export const STEP_LABEL: Record<StageKey, string> = {
  approve: 'Принял',
  start: 'Выехал',
  place: 'Установил',
  pickup: 'Забрал',
  complete: 'Завершил',
};

// Distinct accent per driver for comparison charts (cycles).
export const DRIVER_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#ef4444', '#14b8a6', '#a855f7'];

export const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e4e4e7',
  boxShadow: '0 8px 24px -12px rgba(0,0,0,0.18)',
  fontSize: 12,
  padding: '8px 12px',
};
