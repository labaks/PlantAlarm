import { Language, formatDays, translate } from './i18n';

export function generatePlantId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface Plant {
  id: string;
  name: string;
  intervalDays: number;
  /** ISO date string (yyyy-MM-dd), no time component. */
  lastWatered: string;
  /** ISO date string of the day we last sent a "needs water" notification, to avoid duplicates. */
  lastNotifiedDate?: string;
  /** Epoch milliseconds of the last edit, used to resolve conflicts when syncing with the desktop. */
  updatedAt: number;
  /**
   * Soft-delete tombstone: deleting sets this instead of removing the record, so the deletion
   * itself has an updatedAt and can propagate through sync instead of the plant just reappearing
   * from whichever device hasn't deleted it yet.
   */
  deleted?: boolean;
  /**
   * Local file URI for the plant's photo. Device-local only — deliberately not synced (the
   * desktop's sync response never carries it), since a phone URI is meaningless on the desktop
   * and vice versa. backgroundSync.ts re-attaches it after every sync round-trip.
   */
  photoUri?: string;
}

export function nowMs(): number {
  return Date.now();
}

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function today(): Date {
  return toDateOnly(new Date());
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toDateOnly(b).getTime() - toDateOnly(a).getTime()) / msPerDay);
}

export function nextWaterDate(plant: Plant): Date {
  const last = parseDate(plant.lastWatered);
  const next = new Date(last);
  next.setDate(next.getDate() + plant.intervalDays);
  return next;
}

export function daysLeft(plant: Plant): number {
  return daysBetween(today(), nextWaterDate(plant));
}

export function isWaterable(plant: Plant): boolean {
  return daysLeft(plant) <= 0;
}

export function fillFraction(plant: Plant): number {
  if (plant.intervalDays <= 0) return 0;
  const elapsed = daysBetween(parseDate(plant.lastWatered), today());
  return Math.min(1, Math.max(0, 1 - elapsed / plant.intervalDays));
}

export function statusText(plant: Plant, language: Language): string {
  const days = daysLeft(plant);
  if (days < 0) return translate('status_overdue', language, formatDays(-days, language));
  if (days === 0) return translate('status_due_today', language);
  if (days === 1) return translate('status_tomorrow', language);
  return translate('status_in_days', language, formatDays(days, language));
}

export function statusColor(plant: Plant): string {
  const days = daysLeft(plant);
  if (days <= 0) return '#E05A47';
  if (days <= 1) return '#E0A830';
  return '#4CAF50';
}
