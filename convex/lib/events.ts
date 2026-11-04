import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type AutomationEvent = {
  idempotencyKey: string;
  loanId?: Id<"loans">;
  kind: "notification" | "overdue_reminder" | "automation_error";
  status: "sent" | "failed";
  source: string;
  message?: string;
};

export async function recordAutomationEvent(
  ctx: MutationCtx,
  event: AutomationEvent,
): Promise<{ duplicate: boolean }> {
  const existing = await ctx.db
    .query("automationEvents")
    .withIndex("by_key", (q) => q.eq("idempotencyKey", event.idempotencyKey))
    .unique();

  if (existing) {
    if (existing.status === "failed" && event.status === "sent") {
      await ctx.db.patch(existing._id, { status: "sent", message: event.message, at: Date.now() });
      return { duplicate: false };
    }
    return { duplicate: true };
  }

  await ctx.db.insert("automationEvents", {
    ...event,
    message: event.message?.slice(0, 500),
    at: Date.now(),
  });
  return { duplicate: false };
}
