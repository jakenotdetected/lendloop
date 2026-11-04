import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { firstNameOf, requireAdmin } from "./lib/auth";
import { liveTool, retireTool } from "./lib/tools";
import { activityFor, isOverdue } from "./lib/loans";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAdmin(ctx);

    const [tools, loans, users, errors] = await Promise.all([
      ctx.db
        .query("tools")
        .filter((q) => q.eq(q.field("removedAt"), undefined))
        .order("desc")
        .take(200),
      ctx.db.query("loans").order("desc").take(200),
      ctx.db.query("users").take(500),
      ctx.db
        .query("automationEvents")
        .withIndex("by_kind", (q) => q.eq("kind", "automation_error"))
        .order("desc")
        .take(20),
    ]);

    const userById = new Map(users.map((user) => [user._id, user]));
    const toolById = new Map(tools.map((tool) => [tool._id, tool]));

    const loanRows = await Promise.all(
      loans.map(async (loan) => {
        const tool = toolById.get(loan.toolId) ?? (await ctx.db.get(loan.toolId));
        return {
          _id: loan._id,
          toolName: tool?.name ?? "Removed tool",
          lenderFirstName: firstNameOf(userById.get(loan.lenderId) ?? null),
          borrowerFirstName: firstNameOf(userById.get(loan.borrowerId) ?? null),
          startDate: loan.startDate,
          endDate: loan.endDate,
          status: loan.status,
          overdue: isOverdue(loan),
          activity: await activityFor(ctx, loan._id),
        };
      }),
    );

    const listingCounts = new Map<string, number>();
    for (const tool of tools) listingCounts.set(tool.ownerId, (listingCounts.get(tool.ownerId) ?? 0) + 1);

    return {
      tools: tools.map((tool) => ({
        _id: tool._id,
        name: tool.name,
        category: tool.category,
        ownerFirstName: firstNameOf(userById.get(tool.ownerId) ?? null),
      })),
      loans: loanRows,
      lenders: users
        .filter((user) => listingCounts.has(user._id) || user.trustedLender)
        .map((user) => ({
          _id: user._id,
          firstName: firstNameOf(user),
          email: user.email ?? null,
          trustedLender: user.trustedLender,
          listings: listingCounts.get(user._id) ?? 0,
          isSelf: user._id === viewer._id,
        })),
      errors: errors.map(({ _id, source, message, at }) => ({ _id, source, message: message ?? null, at })),
    };
  },
});

export const removeListing = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, args) => {
    const viewer = await requireAdmin(ctx);
    const tool = await liveTool(ctx, args.toolId);
    await retireTool(ctx, tool, viewer._id);
  },
});

export const setTrustedLender = mutation({
  args: { userId: v.id("users"), trusted: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("That user no longer exists.");
    await ctx.db.patch(user._id, { trustedLender: args.trusted });
  },
});

export const setRole = internalMutation({
  args: { email: v.string(), role: v.union(v.literal("admin"), v.literal("user")) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
    if (!user) throw new ConvexError("No user with that email has signed in yet.");
    await ctx.db.patch(user._id, { role: args.role });
    return { userId: user._id, role: args.role };
  },
});
