import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { category, condition, loanStatus, notificationType } from "./lib/validators";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    trustedLender: v.boolean(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category,
    condition,
    description: v.string(),
    photoId: v.optional(v.id("_storage")),
    removedAt: v.optional(v.number()),
    removedBy: v.optional(v.id("users")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"])
    .index("by_photo", ["photoId"]),

  loans: defineTable({
    toolId: v.id("tools"),
    lenderId: v.id("users"),
    borrowerId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    status: loanStatus,
    decidedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
  })
    .index("by_tool_status", ["toolId", "status"])
    .index("by_borrower", ["borrowerId"])
    .index("by_lender", ["lenderId"])
    .index("by_status_end", ["status", "endDate"]),

  outbox: defineTable({
    loanId: v.id("loans"),
    recipientId: v.id("users"),
    type: notificationType,
    status: v.union(v.literal("pending"), v.literal("delivered"), v.literal("failed")),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_loan", ["loanId"])
    .index("by_status", ["status"]),

  automationEvents: defineTable({
    idempotencyKey: v.string(),
    loanId: v.optional(v.id("loans")),
    kind: v.union(
      v.literal("notification"),
      v.literal("overdue_reminder"),
      v.literal("automation_error"),
    ),
    status: v.union(v.literal("sent"), v.literal("failed")),
    source: v.string(),
    message: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_key", ["idempotencyKey"])
    .index("by_loan", ["loanId"])
    .index("by_kind", ["kind"]),
});
