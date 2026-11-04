import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { daysBetween } from "./lib/dates";
import { recordAutomationEvent } from "./lib/events";

export const overdueLoans = internalQuery({
  args: { asOf: v.string() },
  handler: async (ctx, args) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status_end", (q) => q.eq("status", "approved").lt("endDate", args.asOf))
      .take(500);

    const result = [];
    for (const loan of loans) {
      const idempotencyKey = `reminder:${loan._id}:${args.asOf}`;
      const already = await ctx.db
        .query("automationEvents")
        .withIndex("by_key", (q) => q.eq("idempotencyKey", idempotencyKey))
        .unique();
      if (already?.status === "sent") continue;

      const [borrower, tool] = await Promise.all([ctx.db.get(loan.borrowerId), ctx.db.get(loan.toolId)]);
      if (!borrower?.email) continue;

      result.push({
        loanId: loan._id,
        idempotencyKey,
        borrower: { email: borrower.email, firstName: borrower.firstName ?? null },
        toolName: tool?.name ?? "a tool",
        endDate: loan.endDate,
        daysOverdue: daysBetween(loan.endDate, args.asOf),
      });
    }
    return result;
  },
});

export const recordReminder = internalMutation({
  args: {
    loanId: v.string(),
    idempotencyKey: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const loanId = ctx.db.normalizeId("loans", args.loanId);
    if (!loanId || !(await ctx.db.get(loanId))) throw new ConvexError("Unknown loan.");
    if (!args.idempotencyKey.startsWith(`reminder:${loanId}:`)) throw new ConvexError("Key does not match loan.");
    return await recordAutomationEvent(ctx, {
      idempotencyKey: args.idempotencyKey,
      loanId,
      kind: "overdue_reminder",
      status: args.status,
      source: "n8n:overdue-reminders",
      message: args.message,
    });
  },
});

export const recordNotification = internalMutation({
  args: {
    eventId: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const outboxId = ctx.db.normalizeId("outbox", args.eventId);
    const entry = outboxId ? await ctx.db.get(outboxId) : null;
    if (!entry) throw new ConvexError("Unknown event.");
    return await recordAutomationEvent(ctx, {
      idempotencyKey: `notification:${entry._id}`,
      loanId: entry.loanId,
      kind: "notification",
      status: args.status,
      source: `n8n:request-notification:${entry.type}`,
      message: args.message,
    });
  },
});

export const recordWorkflowError = internalMutation({
  args: {
    workflow: v.string(),
    executionId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await recordAutomationEvent(ctx, {
      idempotencyKey: `error:${args.workflow}:${args.executionId}`,
      kind: "automation_error",
      status: "failed",
      source: `n8n:${args.workflow}`.slice(0, 120),
      message: args.message,
    });
  },
});
