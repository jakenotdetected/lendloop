# LendLoop

A neighbourhood tool library. Neighbours list tools they are happy to lend, request tools from each other for specific dates, and get notified as requests move through their lifecycle. Overdue loans are chased automatically.

**Stack:** Next.js 16 (App Router) · Convex · Clerk · n8n

**Live demo:** https://lendloop-three.vercel.app (Vercel + Convex cloud, Clerk development instance). The hosted demo has no n8n instance attached, so notifications are recorded in Convex as not delivered; run the workflows locally to see them fire.

## What it does

| Area | Behaviour |
| --- | --- |
| Public page | Shows the names and categories of tools currently available. No owner details, descriptions or identities are exposed to signed-out visitors. |
| Listings | Signed-in users create, edit and remove their own tools (name, category, condition, description). |
| Requests | Borrowers request a tool for a date range. Lenders approve or decline; borrowers can cancel a pending request; lenders mark a loan returned. |
| Availability | Approved loans block overlapping requests. A tool shows as *on loan* while an approved loan is in progress. |
| Notifications | Every lifecycle change (created, approved, declined, cancelled, returned) is sent to n8n, which notifies the right person and writes the result back. |
| Overdue reminders | A daily n8n schedule asks Convex for overdue loans, reminds each borrower once per day, and records the reminder. |
| Activity | Each loan shows its recent automation history ("Reminder sent 2 days ago"). |
| Admin | Admins see all listings and loans, remove listings, mark lenders as trusted, and see automation errors. |

## Architecture

```
 Browser ──► Next.js (Clerk session) ──► Convex queries / mutations
                                              │
                                              │ outbox row + scheduled action
                                              ▼
                                   signed POST ──► n8n "Request notification"
                                                         │
             Convex HTTP actions ◄── signed write-back ──┘
             /n8n/notification-result
             /n8n/overdue-loans      ◄── n8n "Overdue reminders" (daily 09:00)
             /n8n/reminders
             /n8n/workflow-error     ◄── n8n "Error handler"
```

- **Convex is the source of truth.** All business rules and role checks live in Convex functions (`convex/`), never only in the UI. The client is untrusted.
- **Outbox pattern.** A mutation that changes a loan inserts an `outbox` row in the same transaction and schedules `notifications.deliver`. Delivery happens in an action, so a slow or unavailable n8n never blocks or rolls back the user's action. Failed deliveries retry with exponential backoff (5 attempts) and are then marked failed and surfaced to admins.
- **Idempotent write-backs.** Every result n8n reports is stored in `automationEvents` under an idempotency key (`reminder:<loanId>:<date>`, `notification:<outboxId>`, `error:<workflow>:<executionId>`). Replays and n8n retries are acknowledged without creating duplicates, and the overdue query skips loans already reminded that day.

### Data model (`convex/schema.ts`)

`users` (role, trustedLender) · `tools` (soft-deleted via `removedAt`) · `loans` (date strings, status) · `outbox` · `automationEvents`

## Security and privacy decisions

- **Authentication:** Clerk issues a JWT that Convex verifies (`convex/auth.config.ts`). `/dashboard` is also protected at the edge by `proxy.ts`.
- **Authorisation in the backend:** every mutation re-checks ownership and role (`requireViewer`, `requireAdmin`). For example, only the lender can approve or mark returned, only the borrower can cancel, and nobody can borrow their own tool. Approval re-checks availability to prevent races.
- **Roles are not self-assignable.** New users are always `user`. Admins are granted only through an internal mutation run by an operator from the Convex CLI.
- **Data minimisation:**
  - Other users only ever see a neighbour's first name. Emails are never sent to the browser except to admins.
  - The public page returns only tool name and category.
  - The payload sent to n8n carries only what the message needs: recipient email and first name, tool name, dates and status.
- **Signed webhooks in both directions:**
  - Requests are signed with HMAC-SHA256 over `timestamp.body` (header `x-lendloop-signature: t=…,v1=…`).
  - Signatures are checked with a constant-time comparison and a 5-minute replay window.
  - Each direction uses its own secret, so leaking one does not let an attacker forge the other.
  - Convex rejects unsigned or stale calls with `401` and oversized bodies with `413`.
- **Input validation:** Convex validators on every argument, length limits on text, and date rules (no past dates, at most 30 days per loan, at most 90 days ahead).
- **No secrets in the client or repo.** Only the Convex URL and Clerk publishable key are public. `.env*` files are git-ignored, and example files are provided.

## Local setup

### Prerequisites

Node 20+, Docker, a free [Clerk](https://clerk.com) application and a free [Convex](https://convex.dev) account.

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Clerk

1. Create a Clerk application with email sign-in.
2. In **Configure → Integrations**, activate **Convex**.
3. In **Configure → Sessions → Customize session token**, add the claims LendLoop uses for notifications:
   ```json
   { "email": "{{user.primary_email_address}}", "given_name": "{{user.first_name}}" }
   ```
4. Copy the **Frontend API URL** (the issuer, e.g. `https://xxx.clerk.accounts.dev`).
5. Put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`.

### 3. Convex

```bash
npx convex dev
```

This creates a deployment and writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`. Leave it running, and in a second terminal set the backend environment:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://xxx.clerk.accounts.dev
npx convex env set N8N_WEBHOOK_SECRET <random 32+ byte hex>
npx convex env set N8N_CALLBACK_SECRET <different random 32+ byte hex>
npx convex env set N8N_REQUEST_WEBHOOK_URL <n8n production webhook URL, see below>
```

Generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### 4. n8n

```bash
cp .env.n8n.example .env.n8n
```

| Variable | Value |
| --- | --- |
| `LENDLOOP_WEBHOOK_SECRET` | same value as `N8N_WEBHOOK_SECRET` in Convex |
| `LENDLOOP_CALLBACK_SECRET` | same value as `N8N_CALLBACK_SECRET` in Convex |
| `LENDLOOP_CONVEX_SITE_URL` | your Convex **HTTP actions** URL, `https://<deployment>.convex.site` (or `http://host.docker.internal:3211` for a local Convex backend) |
| `N8N_ENCRYPTION_KEY` | any random string |

Start n8n and import the workflows:

```bash
docker compose up -d
docker compose exec n8n n8n import:workflow --separate --input=/workflows
```

Open http://localhost:5678, create the owner account, and activate **LendLoop – Request notification** and **LendLoop – Overdue reminders**. **LendLoop – Error handler** is already set as their error workflow.

The notification webhook path is `/webhook/lendloop-events`. Convex cloud cannot reach `localhost`, so expose n8n with a tunnel and use that URL:

```bash
npx convex env set N8N_REQUEST_WEBHOOK_URL https://<your-tunnel>/webhook/lendloop-events
```

Any tunnel works, e.g. `cloudflared tunnel --url http://localhost:5678`. If you run n8n on a public host, set `WEBHOOK_URL` in `.env.n8n` to that host.

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000 and sign in. To make yourself an admin after your first sign-in:

```bash
npx convex run admin:setRole '{"email":"you@example.com","role":"admin"}'
```

To fill the board with example neighbours and tools (safe to run more than once):

```bash
npx convex run demo:seed
```

## n8n workflows (`n8n/workflows/`)

| Workflow | Trigger | Steps |
| --- | --- | --- |
| Request notification | Webhook `POST /webhook/lendloop-events` | Verify signature → reply 202 (or 401) → compose message → send (mock) → sign → record delivery in Convex |
| Overdue reminders | Daily at 09:00 | Sign → fetch overdue loans from Convex → one item per loan → send reminder (mock) → sign → record reminder in Convex |
| Error handler | Error Trigger | Sign → report the failed workflow, execution and node to Convex, where it appears in the admin panel |

The "send" steps log to the n8n console instead of emailing. Swapping in the Gmail, SMTP or Slack node is a one-node change. HTTP nodes retry on failure, and the Convex endpoints are idempotent, so retries are safe.

## Testing notes

The flow was exercised end to end against a local Convex backend, with the workflows' Code-node logic run against it:
- Creating and approving a request each produce exactly one signed notification and one write-back. Decline, cancel and return use the same outbox path.
- A delivery made while n8n was down is retried and lands once n8n is reachable.
- The overdue run reminds once. A second run the same day returns no loans, and replaying the write-back is acknowledged as a duplicate.
- Tampered or missing signatures are rejected with `401`.
- Non-owners cannot edit listings, approve their own requests, borrow their own tools, or call admin functions.

See [PRODUCTION.md](PRODUCTION.md) for what I would change before running this for real users.
