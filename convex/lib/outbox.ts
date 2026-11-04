import type { Infer } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { notificationType } from "./validators";

export async function enqueueNotification(
  ctx: MutationCtx,
  loanId: Id<"loans">,
  recipientId: Id<"users">,
  type: Infer<typeof notificationType>,
): Promise<void> {
  const outboxId = await ctx.db.insert("outbox", {
    loanId,
    recipientId,
    type,
    status: "pending",
    attempts: 0,
  });
  await ctx.scheduler.runAfter(0, internal.notifications.deliver, { outboxId });
}
