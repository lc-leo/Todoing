import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { zhCN } from "date-fns/locale";

export function todayIso(from = new Date()): string {
  return format(from, "yyyy-MM-dd");
}

export function parseDue(iso: string): Date {
  return parseISO(`${iso}T12:00:00`);
}

export function greeting(from = new Date()): string {
  const hour = from.getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function formatLongDate(from = new Date()): string {
  return format(from, "M月d日 EEEE", { locale: zhCN });
}

export function formatDueLabel(iso: string, from = new Date()): string {
  const date = parseDue(iso);
  if (isToday(date)) return "今天";
  if (isTomorrow(date)) return "明天";
  if (isYesterday(date)) return "昨天";
  if (isSameDay(date, addDays(from, 2))) return format(date, "EEE", { locale: zhCN });
  if (date.getFullYear() === from.getFullYear()) {
    return format(date, "M月d日 EEE", { locale: zhCN });
  }
  return format(date, "yyyy年M月d日", { locale: zhCN });
}

export function isOverdue(iso: string | null, from = new Date()): boolean {
  if (!iso) return false;
  return startOfDay(parseDue(iso)).getTime() < startOfDay(from).getTime();
}

export function isDueSoon(iso: string | null, from = new Date()): boolean {
  if (!iso) return false;
  const date = startOfDay(parseDue(iso));
  const today = startOfDay(from);
  const diff = date.getTime() - today.getTime();
  return diff >= 0 && diff <= 2 * 24 * 60 * 60 * 1000;
}

export function weekRange(from = new Date()): { start: Date; end: Date } {
  const start = startOfWeek(from, { weekStartsOn: 1 });
  const end = endOfWeek(from, { weekStartsOn: 1 });
  return { start, end };
}

export function weekDays(from = new Date()): Date[] {
  const { start, end } = weekRange(from);
  return eachDayOfInterval({ start, end });
}

export function isInCurrentWeek(iso: string | null, from = new Date()): boolean {
  if (!iso) return false;
  const date = startOfDay(parseDue(iso));
  const { start, end } = weekRange(from);
  return date.getTime() >= startOfDay(start).getTime() && date.getTime() <= startOfDay(end).getTime();
}

export function formatWeekday(date: Date): string {
  return format(date, "EEE", { locale: zhCN });
}

export function formatMonthDay(date: Date): string {
  return format(date, "M月d日", { locale: zhCN });
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
