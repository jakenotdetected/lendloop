import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewer } from "./lib/auth";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("You need to sign in first.");

    const email = identity.email?.toLowerCase();
    const firstName = (identity.givenName ?? identity.name?.split(" ")[0] ?? "").slice(0, 40) || undefined;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      if (existing.email !== email || existing.firstName !== firstName) {
        await ctx.db.patch(existing._id, { email, firstName });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email,
      firstName,
      role: "user",
      trustedLender: false,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
    return {
      _id: viewer._id,
      firstName: viewer.firstName ?? null,
      role: viewer.role,
      trustedLender: viewer.trustedLender,
    };
  },
});
