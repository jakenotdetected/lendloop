# Production readiness

What I would change or add before LendLoop served real neighbourhoods, roughly in priority order.

## Messaging

- **Replace the mock senders.**
  - Use a transactional email provider (Postmark, Resend or SES) with verified SPF, DKIM and DMARC, or Slack/WhatsApp where a community prefers it.
  - Keep message templates in one place and include an unsubscribe / notification-preferences link.
- **Notification preferences.** Let users choose channels and opt out of non-essential messages; store consent with a timestamp.
- **Quiet hours and time zones.** Store each user's time zone and send reminders in their morning, not at 09:00 UTC.

## Security

- **Secret rotation.**
  - Accept two active secrets per direction during a rotation window (`v1` signatures from either), then retire the old one.
  - Keep secrets in a manager (Doppler, 1Password, AWS Secrets Manager), not in `.env` files on hosts.
- **Rate limiting.** Add per-user limits on request creation and listing changes (e.g. the Convex rate-limiter component) and IP limits on the public page and webhooks.
- **n8n hardening.**
  - Run n8n behind TLS with SSO or strong owner auth.
  - Restrict the webhook path at the proxy and allow-list Convex egress where possible.
  - Move the shared secrets from environment variables into n8n credentials, so `N8N_BLOCK_ENV_ACCESS_IN_NODE` can go back to its default of `true`.
- **Abuse handling.** Add reporting of listings and users, admin audit logs for removals and role changes, and blocking between users.
- **Dependency and supply-chain hygiene.** Run Dependabot/Renovate, `npm audit` in CI, and pin the n8n image digest.

## Data and privacy

- **Retention.**
  - Purge `automationEvents` and delivered `outbox` rows after e.g. 90 days with a Convex cron.
  - Anonymise loans of deleted accounts.
- **Account deletion and export.** Handle Clerk `user.deleted` webhooks to remove or anonymise a user's data, and offer a data export for subject-access requests.
- **Privacy policy and terms.** Cover what is shared with neighbours (first name only) and with processors (Clerk, Convex, email provider).

## Scale and correctness

- **Pagination.** Replace the `take(200)` caps with `usePaginatedQuery` on browse, admin lists and history.
- **Search and location.** Add text search on tool names and a neighbourhood/postcode scope so lists stay relevant as the user base grows.
- **Time zones for dates.** Loans use calendar-date strings compared against UTC "today". Production should store the community's time zone and evaluate "today" and "overdue" in it.
- **Dead-letter handling.** Add an admin action to retry failed outbox rows, and alert when failures exceed a threshold.

## Operations

- **Environments.** Separate dev, preview and prod Convex deployments and Clerk instances. Run preview deployments per pull request.
- **CI.** Typecheck, lint, unit tests for the date and signing helpers, and an integration test that drives the signed webhook endpoints with `convex-test`.
- **Monitoring.**
  - Send Convex log streams and n8n execution failures to an error tracker (Sentry) and an uptime monitor.
  - Page on repeated automation errors, not single ones.
- **Backups.** Schedule Convex snapshot exports and n8n workflow exports to versioned storage. Keep workflows in git as they are here.

## Product

- **Images** of tools (Convex file storage with size and type limits and stripped EXIF data).
- **Handover details.** Pickup arrangements shared only after approval, a deposit or condition notes at handover, and ratings after return feeding into the trusted-lender flag.
- **Accessibility pass** with a screen reader and keyboard-only navigation, plus automated axe checks in CI.
