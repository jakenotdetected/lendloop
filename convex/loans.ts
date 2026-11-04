import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { firstNameOf, getViewer, requireViewer } from "./lib/auth";
import { assertLoanRange, rangesOverlap, todayIso } from "./lib/dates";
import { enqueueNotification } from "./lib/outbox";
import { activityFor, isOverdue } from "./lib/loans";
import { approvedLoansFor, liveTool } from "./lib/tools";

async function loanView(ctx: QueryCtx, loan: Doc<"loans">, counterpartId: Id<"users">) {
  const [tool, counterpart, activity] = await Promise.all([
    ctx.db.get(loan.toolId),
    ctx.db.get(counterpartId),
    activityFor(ctx, loan._id),
  ]);
  return {
    _id: loan._id,
    toolName: tool?.name ?? "Removed tool",
    toolRemoved: tool?.removedAt !== undefined,
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: loan.status,
    overdue: isOverdue(loan),
    counterpartFirstName: firstNameOf(counterpart),
    counterpartTrusted: counterpart?.trustedLender ?? false,
    requestedAt: loan._creationTime,
    activity,
  };
}

export const myRequests = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", viewer._id))
      .order("desc")
      .take(100);
    return await Promise.all(loans.map((loan) => loanView(ctx, loan, loan.lenderId)));
  },
});

export const incoming = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderId", viewer._id))
      .order("desc")
      .take(100);
    return await Promise.all(loans.map((loan) => loanView(ctx, loan, loan.borrowerId)));
  },
});

export const request = mutation({
  args: {
    toolId: v.id("tools"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const tool = await liveTool(ctx, args.toolId);
    if (tool.ownerId === viewer._id) throw new ConvexError("You can't borrow your own tool.");
    assertLoanRange(args.startDate, args.endDate);

    const approved = await approvedLoansFor(ctx, tool._id);
    if (approved.some((loan) => rangesOverlap(loan.startDate, loan.endDate, args.startDate, args.endDate))) {
      throw new ConvexError("That tool is already booked for some of those dates.");
    }

    const pending = await ctx.db
      .query("loans")
      .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "requested"))
      .collect();
    if (pending.some((loan) => loan.borrowerId === viewer._id)) {
      throw new ConvexError("You already have a pending request for this tool.");
    }

    const loanId = await ctx.db.insert("loans", {
      toolId: tool._id,
      lenderId: tool.ownerId,
      borrowerId: viewer._id,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "requested",
    });
    await enqueueNotification(ctx, loanId, tool.ownerId, "request_created");
    return loanId;
  },
});

export const decide = mutation({
  args: {
    loanId: v.id("loans"),
    decision: v.union(v.literal("approved"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.lenderId !== viewer._id) throw new ConvexError("You can only answer requests for your own tools.");
    if (loan.status !== "requested") throw new ConvexError("This request has already been answered.");

    if (args.decision === "approved") {
      await liveTool(ctx, loan.toolId);
      if (loan.endDate < todayIso()) throw new ConvexError("This request's dates have already passed.");
      const approved = await approvedLoansFor(ctx, loan.toolId);
      if (approved.some((other) => rangesOverlap(other.startDate, other.endDate, loan.startDate, loan.endDate))) {
        throw new ConvexError("You've already approved another loan for overlapping dates.");
      }
    }

    await ctx.db.patch(loan._id, { status: args.decision, decidedAt: Date.now() });
    await enqueueNotification(
      ctx,
      loan._id,
      loan.borrowerId,
      args.decision === "approved" ? "request_approved" : "request_declined",
    );
  },
});

export const markReturned = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.lenderId !== viewer._id) throw new ConvexError("Only the lender can mark a loan returned.");
    if (loan.status !== "approved") throw new ConvexError("Only active loans can be marked returned.");
    await ctx.db.patch(loan._id, { status: "returned", returnedAt: Date.now() });
    await enqueueNotification(ctx, loan._id, loan.borrowerId, "loan_returned");
  },
});

export const cancel = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const loan = await ctx.db.get(args.loanId);
    if (!loan || loan.borrowerId !== viewer._id) throw new ConvexError("You can only cancel your own requests.");
    if (loan.status !== "requested") throw new ConvexError("Only pending requests can be cancelled.");
    await ctx.db.patch(loan._id, { status: "cancelled", decidedAt: Date.now() });
    await enqueueNotification(ctx, loan._id, loan.lenderId, "request_cancelled");
  },
});
