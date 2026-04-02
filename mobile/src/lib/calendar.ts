export const HOUR_HEIGHT = 88;
export const START_HOUR = 0;
export const END_HOUR = 24;
export const HOUR_LABEL_WIDTH = 60;
export const MIN_BLOCK_HEIGHT = 44;
export const TOTAL_CANVAS_HEIGHT = 24 * HOUR_HEIGHT;

export function getActivityPosition(startTime: string, durationMinutes: number) {
  const date = new Date(startTime);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const top = (hour + minute / 60) * HOUR_HEIGHT;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, MIN_BLOCK_HEIGHT);
  return { top, height };
}

export function getCurrentTimeOffset(): number {
  const now = new Date();
  return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
}

export function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}
