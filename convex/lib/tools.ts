import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { todayIso } from "./dates";
import { enqueueNotification } from "./outbox";
import { LIMITS, PHOTO_TYPES } from "./validators";

export type ToolStatus = "available" | "on_loan";

export async function approvedLoansFor(ctx: QueryCtx, toolId: Id<"tools">) {
  return await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", "approved"))
    .collect();
}

export async function toolStatus(ctx: QueryCtx, toolId: Id<"tools">): Promise<{
  status: ToolStatus;
  bookings: { startDate: string; endDate: string }[];
}> {
  const today = todayIso();
  const approved = await approvedLoansFor(ctx, toolId);
  const onLoan = approved.some((loan) => loan.startDate <= today);
  const bookings = approved
    .filter((loan) => loan.startDate > today)
    .map(({ startDate, endDate }) => ({ startDate, endDate }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return { status: onLoan ? "on_loan" : "available", bookings };
}

export async function liveTool(ctx: QueryCtx, toolId: Id<"tools">): Promise<Doc<"tools">> {
  const tool = await ctx.db.get(toolId);
  if (!tool || tool.removedAt !== undefined) throw new ConvexError("That tool is no longer listed.");
  return tool;
}

export function cleanToolFields(fields: { name: string; description: string }) {
  const name = fields.name.trim();
  const description = fields.description.trim();
  if (name.length < 2) throw new ConvexError("Give the tool a name.");
  if (name.length > LIMITS.name) throw new ConvexError(`Names can be at most ${LIMITS.name} characters.`);
  if (description.length > LIMITS.description) {
    throw new ConvexError(`Descriptions can be at most ${LIMITS.description} characters.`);
  }
  return { name, description };
}

export async function checkPhoto(ctx: MutationCtx, photoId: Id<"_storage">, toolId?: Id<"tools">) {
  const file = await ctx.db.system.get(photoId);
  if (!file) throw new ConvexError("That photo didn't upload. Try choosing it again.");
  const inUse = await ctx.db
    .query("tools")
    .withIndex("by_photo", (q) => q.eq("photoId", photoId))
    .first();
  if (inUse && inUse._id !== toolId) throw new ConvexError("That photo belongs to another listing.");
  if (!PHOTO_TYPES.includes(file.contentType ?? "") || file.size > LIMITS.photoBytes) {
    await ctx.storage.delete(photoId);
    throw new ConvexError("Photos must be JPG, PNG or WebP and 5 MB or smaller.");
  }
}

export async function photoUrl(ctx: QueryCtx, tool: Doc<"tools">) {
  return tool.photoId ? await ctx.storage.getUrl(tool.photoId) : null;
}

export async function retireTool(ctx: MutationCtx, tool: Doc<"tools">, actorId: Id<"users">) {
  const today = todayIso();
  const approved = await approvedLoansFor(ctx, tool._id);
  if (approved.some((loan) => loan.startDate <= today)) {
    throw new ConvexError("This tool is out on loan. Mark it returned before removing it.");
  }

  const requested = await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "requested"))
    .collect();

  for (const loan of [...requested, ...approved]) {
    await ctx.db.patch(loan._id, { status: "cancelled", decidedAt: Date.now() });
    await enqueueNotification(ctx, loan._id, loan.borrowerId, "request_cancelled");
  }

  await ctx.db.patch(tool._id, { removedAt: Date.now(), removedBy: actorId });
}
