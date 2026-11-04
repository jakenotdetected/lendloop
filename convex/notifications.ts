import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { signBody, SIGNATURE_HEADER } from "./lib/signing";
import { recordAutomationEvent } from "./lib/events";

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

export const deliveryPayload = internalQuery({
  args: { outboxId: v.id("outbox") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.outboxId);
    if (!entry || entry.status !== "pending") return null;
    const [loan, recipient] = await Promise.all([ctx.db.get(entry.loanId), ctx.db.get(entry.recipientId)]);
    if (!loan) return null;
    const tool = await ctx.db.get(loan.toolId);
    return {
      eventId: entry._id,
      type: entry.type,
      loanId: loan._id,
      recipient: {
        email: recipient?.email ?? null,
        firstName: recipient?.firstName ?? null,
      },
      toolName: tool?.name ?? "a tool",
      startDate: loan.startDate,
      endDate: loan.endDate,
      status: loan.status,
    };
  },
});

export const deliver = internalAction({
  args: { outboxId: v.id("outbox") },
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(internal.notifications.deliveryPayload, args);
    if (!payload) return;

    const url = process.env.N8N_REQUEST_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!url || !secret) {
      await ctx.runMutation(internal.notifications.recordAttempt, {
        ...args,
        ok: false,
        retry: false,
        error: "N8N_REQUEST_WEBHOOK_URL or N8N_WEBHOOK_SECRET is not set.",
      });
      return;
    }
    if (!payload.recipient.email) {
      await ctx.runMutation(internal.notifications.recordAttempt, {
        ...args,
        ok: false,
        retry: false,
        error: "Recipient has no email address on file.",
      });
      return;
    }

    const body = JSON.stringify(payload);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let ok = false;
    let error: string | undefined;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [SIGNATURE_HEADER]: await signBody(secret, body),
        },
        body,
        signal: controller.signal,
      });
      ok = response.ok;
      if (!ok) error = `n8n responded with HTTP ${response.status}.`;
    } catch (err) {
      error = err instanceof Error ? err.message : "Request to n8n failed.";
    } finally {
      clearTimeout(timer);
    }

    await ctx.runMutation(internal.notifications.recordAttempt, { ...args, ok, retry: true, error });
  },
});

export const recordAttempt = internalMutation({
  args: {
    outboxId: v.id("outbox"),
    ok: v.boolean(),
    retry: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.outboxId);
    if (!entry || entry.status !== "pending") return;
    const attempts = entry.attempts + 1;

    if (args.ok) {
      await ctx.db.patch(entry._id, { status: "delivered", attempts, deliveredAt: Date.now(), lastError: undefined });
      return;
    }

    if (args.retry && attempts < MAX_ATTEMPTS) {
      await ctx.db.patch(entry._id, { attempts, lastError: args.error });
      await ctx.scheduler.runAfter(BASE_BACKOFF_MS * 2 ** (attempts - 1), internal.notifications.deliver, {
        outboxId: entry._id,
      });
      return;
    }

    await ctx.db.patch(entry._id, { status: "failed", attempts, lastError: args.error });
    await recordAutomationEvent(ctx, {
      idempotencyKey: `outbox-failed:${entry._id}`,
      loanId: entry.loanId,
      kind: "automation_error",
      status: "failed",
      source: `convex:notify:${entry.type}`,
      message: `Gave up after ${attempts} attempt(s): ${args.error ?? "unknown error"}`,
    });
  },
});
