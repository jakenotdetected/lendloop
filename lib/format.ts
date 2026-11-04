import { ConvexError } from "convex/values";
import { CATEGORIES, CONDITIONS } from "@/convex/lib/validators";

const categoryLabels = new Map<string, string>(CATEGORIES.map((c) => [c.value, c.label]));
const conditionLabels = new Map<string, string>(CONDITIONS.map((c) => [c.value, c.label]));

export function categoryLabel(value: string): string {
  return categoryLabels.get(value) ?? value;
}

export function conditionLabel(value: string): string {
  return conditionLabels.get(value) ?? value;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function dateParts(iso: string): { day: string; month: string } {
  const date = new Date(`${iso}T00:00:00Z`);
  return {
    day: String(date.getUTCDate()),
    month: date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
  };
}

export function formatRange(start: string, end: string): string {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = timestamp - now;
  for (const [unit, ms] of steps) {
    if (Math.abs(diff) >= ms) return relative.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function todayLocalIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function errorMessage(err: unknown): string {
  if (err instanceof ConvexError && typeof err.data === "string") return err.data;
  return "Something went wrong. Please try again.";
}
