import { ConvexError } from "convex/values";
import { MAX_ADVANCE_DAYS, MAX_LOAN_DAYS } from "./validators";

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function assertLoanRange(startDate: string, endDate: string): void {
  if (!isRealDate(startDate) || !isRealDate(endDate)) {
    throw new ConvexError("Dates must be valid calendar dates.");
  }
  const today = todayIso();
  if (startDate < today) throw new ConvexError("The start date can't be in the past.");
  if (endDate < startDate) throw new ConvexError("The return date must be on or after the start date.");
  if (daysBetween(startDate, endDate) + 1 > MAX_LOAN_DAYS) {
    throw new ConvexError(`Loans can be at most ${MAX_LOAN_DAYS} days.`);
  }
  if (daysBetween(today, startDate) > MAX_ADVANCE_DAYS) {
    throw new ConvexError(`Requests can start at most ${MAX_ADVANCE_DAYS} days ahead.`);
  }
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
