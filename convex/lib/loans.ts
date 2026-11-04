import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { todayIso } from "./dates";

export async function activityFor(ctx: QueryCtx, loanId: Id<"loans">) {
  const events = await ctx.db
    .query("automationEvents")
    .withIndex("by_loan", (q) => q.eq("loanId", loanId))
    .order("desc")
    .take(5);
  return events.map(({ _id, kind, status, at }) => ({ _id, kind, status, at }));
}

export function isOverdue(loan: Doc<"loans">, today = todayIso()): boolean {
  return loan.status === "approved" && loan.endDate < today;
}
