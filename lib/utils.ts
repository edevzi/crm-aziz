import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isOverdue(order: any): boolean {
  if (order.status !== 'container_placed' || order.isClosed) return false;
  
  const placedAt = new Date(order.scheduledAt);
  const now = new Date();
  let durationMs = 0;
  
  if (order.rentalDuration === '1_day') {
    durationMs = 24 * 60 * 60 * 1000;
  } else if (order.rentalDuration === '1_week') {
    durationMs = 7 * 24 * 60 * 60 * 1000;
  } else if (order.rentalDuration === '1_month') {
    durationMs = 30 * 24 * 60 * 60 * 1000;
  }

  return (placedAt.getTime() + durationMs) < now.getTime();
}
