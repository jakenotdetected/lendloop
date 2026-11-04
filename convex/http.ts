import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { todayIso } from "./lib/dates";
import { SIGNATURE_HEADER, verifyBody } from "./lib/signing";

type Json = Record<string, unknown>;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function readSigned(request: Request): Promise<Json | Response> {
  const secret = process.env.N8N_CALLBACK_SECRET;
  if (!secret) return json(503, { error: "Callback secret is not configured." });

  const body = await request.text();
  if (body.length > 10_000) return json(413, { error: "Payload too large." });
  if (!(await verifyBody(secret, request.headers.get(SIGNATURE_HEADER), body))) {
    return json(401, { error: "Invalid or expired signature." });
  }

  try {
    const parsed: unknown = JSON.parse(body || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json(400, { error: "Expected a JSON object." });
    return parsed as Json;
  } catch {
    return json(400, { error: "Body is not valid JSON." });
  }
}

function str(body: Json, key: string, max = 200): string | null {
  const value = body[key];
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : null;
}

function outcome(body: Json): "sent" | "failed" | null {
  return body.status === "sent" || body.status === "failed" ? body.status : null;
}

async function guarded(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof ConvexError) return json(400, { error: String(err.data) });
    throw err;
  }
}

const http = httpRouter();

http.route({
  path: "/n8n/overdue-loans",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await readSigned(request);
    if (body instanceof Response) return body;
    const asOf = str(body, "asOf", 10) ?? todayIso();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || asOf > todayIso()) return json(400, { error: "Invalid asOf date." });
    const loans = await ctx.runQuery(internal.automation.overdueLoans, { asOf });
    return json(200, { asOf, loans });
  }),
});

http.route({
  path: "/n8n/reminders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await readSigned(request);
    if (body instanceof Response) return body;
    const loanId = str(body, "loanId");
    const idempotencyKey = str(body, "idempotencyKey");
    const status = outcome(body);
    if (!loanId || !idempotencyKey || !status) return json(400, { error: "loanId, idempotencyKey and status are required." });
    return guarded(async () => {
      const result = await ctx.runMutation(internal.automation.recordReminder, {
        loanId,
        idempotencyKey,
        status,
        message: str(body, "message", 500) ?? undefined,
      });
      return json(200, { ok: true, ...result });
    });
  }),
});

http.route({
  path: "/n8n/notification-result",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await readSigned(request);
    if (body instanceof Response) return body;
    const eventId = str(body, "eventId");
    const status = outcome(body);
    if (!eventId || !status) return json(400, { error: "eventId and status are required." });
    return guarded(async () => {
      const result = await ctx.runMutation(internal.automation.recordNotification, {
        eventId,
        status,
        message: str(body, "message", 500) ?? undefined,
      });
      return json(200, { ok: true, ...result });
    });
  }),
});

http.route({
  path: "/n8n/workflow-error",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await readSigned(request);
    if (body instanceof Response) return body;
    const workflow = str(body, "workflow");
    const executionId = str(body, "executionId");
    const message = str(body, "message", 2_000);
    if (!workflow || !executionId || !message) return json(400, { error: "workflow, executionId and message are required." });
    const result = await ctx.runMutation(internal.automation.recordWorkflowError, { workflow, executionId, message });
    return json(200, { ok: true, ...result });
  }),
});

export default http;
