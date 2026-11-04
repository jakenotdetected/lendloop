import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function getViewer(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export async function requireViewer(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await getViewer(ctx);
  if (!viewer) throw new ConvexError("You need to sign in first.");
  return viewer;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await requireViewer(ctx);
  if (viewer.role !== "admin") throw new ConvexError("Only admins can do that.");
  return viewer;
}

export function firstNameOf(user: Doc<"users"> | null): string {
  return user?.firstName?.trim() || "A neighbour";
}
